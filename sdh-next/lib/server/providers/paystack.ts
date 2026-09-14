// Paystack — wallet top-up payment gateway. SERVER ONLY.
// The only place that talks to Paystack's HTTP API. Wallet top-ups are credited
// ONLY after Paystack confirms the payment (webhook `charge.success` or a verify
// call) — never on the client's say-so.
//
// Flow: initialize() → user pays on Paystack's hosted page (card or MoMo) →
// Paystack calls our webhook + redirects the user back to our callback → we verify
// and credit the wallet idempotently.
//
// Config (.env.local):
//   PAYSTACK_SECRET_KEY   sk_test_… (test) or sk_live_… (live). Blank → dry mode.
//   PAYSTACK_BASE_URL     default https://api.paystack.co

const KEY = process.env.PAYSTACK_SECRET_KEY || "";
const BASE = (process.env.PAYSTACK_BASE_URL || "https://api.paystack.co").replace(/\/+$/, "");

export function paystackMode(): "live" | "test" | "dry" {
  if (!KEY) return "dry";
  return KEY.startsWith("sk_live_") ? "live" : "test";
}

// Paystack works in the currency's smallest unit — pesewas for GHS.
export const toPesewas = (ghs: number) => Math.round(Number(ghs) * 100);
export const fromPesewas = (p: number) => Math.round(Number(p)) / 100;

async function call(path: string, init?: RequestInit): Promise<{ status: number; data: any }> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ---- Initialize a transaction → returns the hosted-checkout URL to redirect to ----
export interface InitInput {
  email: string;
  amountGhs: number;
  reference: string;      // our idempotency key; Paystack echoes it back on webhook/verify
  callbackUrl: string;    // where Paystack redirects the user after payment
  metadata?: Record<string, any>;
}
export async function initialize(
  input: InitInput
): Promise<{ ok: true; authorizationUrl: string; raw: any } | { ok: false; error: string; raw?: any }> {
  try {
    const body = {
      email: input.email,
      amount: toPesewas(input.amountGhs),
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata || {},
    };
    const { status, data } = await call("/transaction/initialize", { method: "POST", body: JSON.stringify(body) });
    if (status >= 200 && status < 300 && data?.status && data?.data?.authorization_url) {
      return { ok: true, authorizationUrl: String(data.data.authorization_url), raw: data };
    }
    return { ok: false, error: data?.message || `Could not start payment (${status})`, raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Paystack", raw: null };
  }
}

// ---- Verify a transaction (callback + webhook backup) ----
export interface VerifyResult {
  ok: true;
  paid: boolean;         // true only when Paystack reports status "success"
  reference: string;
  amountGhs: number;     // amount actually paid (authoritative — from Paystack)
  metadata: Record<string, any>;
  raw: any;
}
export async function verifyTransaction(
  reference: string
): Promise<VerifyResult | { ok: false; error: string; raw?: any }> {
  try {
    const { status, data } = await call(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
    if (status >= 200 && status < 300 && data?.status && data?.data) {
      const d = data.data;
      return {
        ok: true,
        paid: String(d.status).toLowerCase() === "success",
        reference: String(d.reference || reference),
        amountGhs: fromPesewas(Number(d.amount || 0)),
        metadata: d.metadata || {},
        raw: data,
      };
    }
    return { ok: false, error: data?.message || `Verify failed (${status})`, raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Paystack", raw: null };
  }
}

// ---- Refund a charge (guest storefront order the provider couldn't deliver) ----
// A guest paid by mobile money but has no wallet to refund into, so a failed delivery
// is reversed straight back to their MoMo/card via Paystack's refund API. Idempotent on
// Paystack's side — refunding an already-refunded transaction returns an error we treat
// as best-effort. `amountGhs` omitted → full refund.
export async function refundTransaction(
  reference: string,
  amountGhs?: number
): Promise<{ ok: true; raw: any } | { ok: false; error: string; raw?: any }> {
  try {
    const body: Record<string, any> = { transaction: reference };
    if (typeof amountGhs === "number") body.amount = toPesewas(amountGhs);
    const { status, data } = await call("/refund", { method: "POST", body: JSON.stringify(body) });
    if (status >= 200 && status < 300 && data?.status) return { ok: true, raw: data };
    return { ok: false, error: data?.message || `Refund failed (${status})`, raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Paystack", raw: null };
  }
}

// ---- Transfers (payouts to mobile money) ----
// Paystack sends money OUT from your Paystack balance to a recipient. Two steps:
//   1. createTransferRecipient() — register the destination MoMo number (once per number).
//   2. initiateTransfer()        — send the amount; settled asynchronously via webhook.
//
// Requirements on the Paystack dashboard:
//   * "Transfers" must be enabled for your business (Paystack gates this behind KYC).
//   * "OTP for transfers" should be DISABLED so payouts can complete without a per-transfer
//     code sent to the merchant. If it's on, a transfer returns status "otp" and must be
//     finalized manually — we surface that as a still-processing payout.
//   * Your Paystack balance must be funded (it's fed by the payments you collect).

// Ghana mobile-money provider codes used as `bank_code` for a mobile_money recipient.
const MOMO_BANK_CODE: Record<string, string> = { mtn: "MTN", telecel: "VOD", atigo: "ATL" };
export function momoBankCode(network: string): string | null {
  return MOMO_BANK_CODE[network] || null;
}

export async function createTransferRecipient(input: {
  name: string;
  momoNumber: string;   // local 0XXXXXXXXX
  network: string;      // mtn | telecel | atigo
}): Promise<{ ok: true; recipientCode: string; raw: any } | { ok: false; error: string; raw?: any }> {
  const bank = momoBankCode(input.network);
  if (!bank) return { ok: false, error: `Unsupported network: ${input.network}` };
  try {
    const body = {
      type: "mobile_money",
      name: input.name || "Agent payout",
      account_number: input.momoNumber,
      bank_code: bank,
      currency: "GHS",
    };
    const { status, data } = await call("/transferrecipient", { method: "POST", body: JSON.stringify(body) });
    if (status >= 200 && status < 300 && data?.status && data?.data?.recipient_code) {
      return { ok: true, recipientCode: String(data.data.recipient_code), raw: data };
    }
    return { ok: false, error: data?.message || `Could not register payout number (${status})`, raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Paystack", raw: null };
  }
}

// Initiate a transfer. `status` is Paystack's transfer status:
//   success            — sent immediately (rare; usually async)
//   pending / received — in flight; settled later via the transfer.* webhook
//   otp                — account requires per-transfer OTP finalization (see notes above)
//   failed / reversed  — did not complete
export async function initiateTransfer(input: {
  amountGhs: number;
  recipientCode: string;
  reference: string;    // our idempotency key
  reason?: string;
}): Promise<{ ok: true; status: string; transferCode: string; raw: any } | { ok: false; error: string; raw?: any }> {
  try {
    const body = {
      source: "balance",
      amount: toPesewas(input.amountGhs),
      recipient: input.recipientCode,
      reference: input.reference,
      reason: input.reason || "Agent wallet withdrawal",
      currency: "GHS",
    };
    const { status, data } = await call("/transfer", { method: "POST", body: JSON.stringify(body) });
    if (status >= 200 && status < 300 && data?.status && data?.data) {
      return {
        ok: true,
        status: String(data.data.status || "pending").toLowerCase(),
        transferCode: String(data.data.transfer_code || ""),
        raw: data,
      };
    }
    return { ok: false, error: data?.message || `Could not start payout (${status})`, raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Paystack", raw: null };
  }
}

// ---- Webhook signature (HMAC-SHA512 of the raw body, keyed with the secret key) ----
export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!KEY || !signature) return false;
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto.createHmac("sha512", KEY).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
