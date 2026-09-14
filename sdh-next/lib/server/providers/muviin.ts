// Muviin — result-checker vouchers (WASSCE / BECE) AND airtime top-ups. SERVER ONLY.
// The only place that talks to Muviin's HTTP API. Everything else speaks to this
// normalized interface.
//
// API: single endpoint, all actions POST to the base URL with a `func` discriminator.
//   Auth:  Authorization: Bearer <key>  — Muviin issues a SEPARATE key per product, so the
//          key is chosen by the `prod` on each call (airtime vs resultchecker). Using one
//          product's key on the other's endpoint is rejected as an invalid API key.
//   Checkers: GetCheckerPrices | BuyChecker | GetCheckerStatus  (prod: "resultchecker")
//   Airtime:  BuyAirtime | GetAirtimeStatus                     (prod: "airtime")
//   `func` is CASE-SENSITIVE. An unknown one 404s with "The requested operation is not
//   supported for product <prod>", which reads like a permissions problem but isn't.
//
// Config (.env.local):
//   MUVIIN_AIRTIME_API_KEY   airtime key
//   MUVIIN_CHECKER_API_KEY   result-checker key
//   MUVIIN_API_KEY           legacy single key; used for either product if its own key is
//                            unset, so an existing deployment keeps working
//   (a product with no key resolves to dry mode on its own, independently of the other)
//   MUVIIN_BASE_URL   default https://core.muviin.co/src/api/v1
//   MUVIIN_MODE       live | dry  (defaults to dry when no key)
//
// IMPORTANT: Muviin's BuyChecker purchases vouchers in BULK (a batch) and its response /
// GetCheckerStatus return the batch_ref, quantity and amount — but NOT the individual voucher
// PIN + serial numbers. Only WASSCE (checker_type "2") and BECE (checker_type "1") are
// supported. Nov/Dec and CSSPS are not part of this API.

// Muviin issues one key per product. Each falls back to the legacy single key.
export type MuviinProduct = "airtime" | "resultchecker";
const LEGACY_KEY = process.env.MUVIIN_API_KEY || "";
const KEYS: Record<MuviinProduct, string> = {
  airtime: process.env.MUVIIN_AIRTIME_API_KEY || LEGACY_KEY,
  resultchecker: process.env.MUVIIN_CHECKER_API_KEY || LEGACY_KEY,
};
const keyFor = (product: MuviinProduct) => KEYS[product] || "";
const BASE = (process.env.MUVIIN_BASE_URL || "https://core.muviin.co/src/api/v1").replace(/\/+$/, "");
const MODE = (process.env.MUVIIN_MODE || (KEYS.airtime || KEYS.resultchecker ? "live" : "dry")).toLowerCase();

// Longest we'll wait on Muviin before giving up on a single call.
//
// A PURCHASE gets much longer than a lookup, and deliberately so. Muviin has been measured
// taking 14s just to reject an invalid BuyAirtime, so a 12s abort would hang up on a live
// purchase it may still be fulfilling — and our caller reads that abort as a rejection and
// refunds the buyer, who then receives the airtime anyway. Waiting is always cheaper than
// paying for credit we've refunded, so buys wait; read-only status calls stay short so
// reconciling a list of orders never drags.
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 12000);
const PURCHASE_TIMEOUT_MS = Number(process.env.PROVIDER_PURCHASE_TIMEOUT_MS || 30000);

// Per-product: airtime can be live while checkers are still dry, or the other way round.
export function providerMode(product: MuviinProduct = "resultchecker"): "live" | "dry" {
  return MODE === "live" && keyFor(product) ? "live" : "dry";
}

// SDH network id → Muviin's airtime network name. AT is "at" on their side.
export function toAirtimeNetwork(net: string): "mtn" | "at" | "telecel" | null {
  const n = String(net || "").toLowerCase();
  if (n === "mtn") return "mtn";
  if (n === "telecel") return "telecel";
  if (n === "atigo" || n === "at" || n === "airteltigo") return "at";
  return null;
}

// SDH checker product id → Muviin checker_type. Only WASSCE & BECE are supported.
export function toCheckerType(productId: string): "1" | "2" | null {
  if (productId === "wassce") return "2";
  if (productId === "bece") return "1";
  return null; // novdec / cssps aren't offered by Muviin
}

async function call(
  body: Record<string, any> & { prod: MuviinProduct },
  opts: { spends?: boolean } = {}
): Promise<{ status: number; data: any }> {
  // Hard timeout: a provider that stops answering must never hold a request open.
  const res = await fetch(BASE + "/", {
    signal: AbortSignal.timeout(opts.spends ? PURCHASE_TIMEOUT_MS : PROVIDER_TIMEOUT_MS),
    method: "POST",
    headers: {
      Authorization: "Bearer " + keyFor(body.prod),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// Muviin serializes an absent field as the STRING "null", not JSON null — a success looks
// like {"status":1,"error":"null","data":[...]} and a failure like {"error":{...},"data":"null"}.
// "null" is truthy, so every field has to go through here before it's tested or read;
// checking `data.error` directly makes every successful response look like a rejection.
function present(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "" || s === "null" || s === "undefined") return null;
  }
  return v;
}

// Muviin reports success as top-level status===1 with no `error` object.
function accepted(status: number, data: any): boolean {
  return status >= 200 && status < 300 && !!data && Number(data.status) === 1 && !present(data.error);
}
function errorOf(data: any, status: number): string {
  const err = present(data?.error);
  if (typeof err === "string") return err;
  return err?.message || present(data?.message) || `Request failed (${status})`;
}
// The payload of a successful call. Never returns Muviin's "null" string to a caller.
function payload(data: any): any {
  const d = present(data?.data);
  return d && typeof d === "object" ? d : {};
}

// ---- Prices ----
export interface CheckerPrice { cardType: string; price: number }
export async function getCheckerPrices(): Promise<
  { ok: true; prices: CheckerPrice[]; raw: any } | { ok: false; error: string }
> {
  if (providerMode("resultchecker") === "dry")
    return { ok: true, prices: [{ cardType: "WASSCE", price: 17 }, { cardType: "BECE", price: 17 }], raw: { dry: true } };
  try {
    const { status, data } = await call({ func: "GetCheckerPrices", prod: "resultchecker" });
    if (accepted(status, data))
      return { ok: true, prices: (Array.isArray(present(data.data)) ? data.data : []).map((p: any) => ({ cardType: String(p.cardType), price: Number(p.price) })), raw: data };
    return { ok: false, error: errorOf(data, status) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Muviin" };
  }
}

// ---- Buy vouchers (bulk) ----
export interface BuyCheckerResult {
  ok: true;
  batchRef: string;
  quantity: number;
  totalAmount: number;
  status: string;   // muviin doesn't return a live status on buy; we treat acceptance as "processing"
  raw: any;
}
export async function buyChecker(input: {
  productId: string;    // SDH id: wassce | bece
  reference: string;    // our unique extRef (order ref)
}): Promise<BuyCheckerResult | { ok: false; error: string; raw?: any }> {
  const type = toCheckerType(input.productId);
  if (!type) return { ok: false, error: `Unsupported checker type: ${input.productId}` };

  if (providerMode("resultchecker") === "dry")
    return { ok: true, batchRef: "DRY-" + input.reference, quantity: 1, totalAmount: 0, status: "success", raw: { dry: true } };

  try {
    const { status, data } = await call({ func: "BuyChecker", prod: "resultchecker", checker_type: type, extRef: input.reference }, { spends: true });
    if (accepted(status, data)) {
      const d = payload(data);
      return { ok: true, batchRef: String(d.batch_ref || ""), quantity: Number(d.quantity || 0), totalAmount: Number(d.total_amount || 0), status: "processing", raw: data };
    }
    console.error(`Muviin BuyChecker rejected [${status}] ${input.productId}:`, JSON.stringify(data));
    return { ok: false, error: errorOf(data, status), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Muviin", raw: null };
  }
}

// ---- Airtime ----
// `BuyAirtime` sends a top-up. Muviin accepts it and settles asynchronously: the response
// carries `airtimeStatus` (usually "pending"), and GetAirtimeStatus reports the final
// state. We treat anything non-terminal as "processing" and reconcile by polling.
// Muviin enforces its own per-transaction limits, mirrored in airtimePricing.ts.
export const MUVIIN_MIN_AIRTIME = 1;
export const MUVIIN_MAX_AIRTIME = 500;
export interface SendAirtimeResult {
  ok: true;
  transactionId: string;   // Muviin's transaction_id
  status: MuviinStatus;    // processing | delivered | failed
  raw: any;
}
export async function sendAirtime(input: {
  phoneNumber: string;   // local 0XXXXXXXXX
  network: string;       // SDH id: mtn | telecel | atigo
  amountGhs: number;
  reference: string;     // our unique extRef (the order ref)
}): Promise<SendAirtimeResult | { ok: false; error: string; raw?: any }> {
  const network = toAirtimeNetwork(input.network);
  if (!network) return { ok: false, error: `Unsupported network: ${input.network}` };
  const amount = Math.round(Number(input.amountGhs) * 100) / 100;
  if (!amount || amount <= 0) return { ok: false, error: "Invalid airtime amount." };

  if (providerMode("airtime") === "dry")
    return { ok: true, transactionId: "DRY-" + input.reference, status: "delivered", raw: { dry: true } };

  try {
    const { status, data } = await call({
      func: "BuyAirtime",
      prod: "airtime",
      phone: input.phoneNumber,
      amount,
      network,
      extRef: input.reference,
    }, { spends: true });
    if (accepted(status, data)) {
      const d = payload(data);
      return {
        ok: true,
        transactionId: String(d.transaction_id || d.reference || ""),
        status: normalizeStatus(d.airtimeStatus || d.status),
        raw: data,
      };
    }
    console.error(`Muviin airtime rejected [${status}] ${input.network} ${amount}:`, JSON.stringify(data));
    return { ok: false, error: errorOf(data, status), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Muviin", raw: null };
  }
}

// Reconcile one airtime top-up by our extRef.
export async function airtimeStatus(
  reference: string
): Promise<{ ok: true; status: MuviinStatus; transactionId: string; raw: any } | { ok: false; error: string }> {
  if (providerMode("airtime") === "dry") return { ok: true, status: "delivered", transactionId: "DRY", raw: { dry: true } };
  try {
    const { status, data } = await call({ func: "GetAirtimeStatus", prod: "airtime", extRef: reference });
    if (accepted(status, data)) {
      const d = payload(data);
      return { ok: true, status: normalizeStatus(d.status || d.airtimeStatus), transactionId: String(d.transaction_id || d.reference || ""), raw: data };
    }
    return { ok: false, error: errorOf(data, status) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Muviin" };
  }
}

// ---- Status (reconciliation) ----
// Muviin statuses: success | pending | failed. Normalized to our order vocabulary.
export type MuviinStatus = "processing" | "delivered" | "failed";
export type CheckerStatus = MuviinStatus;
export function normalizeStatus(raw: string): MuviinStatus {
  const s = String(raw || "").toLowerCase();
  if (["success", "successful", "completed", "delivered"].includes(s)) return "delivered";
  if (["failed", "error", "cancelled", "canceled", "declined", "rejected"].includes(s)) return "failed";
  return "processing";
}
export async function checkerStatus(
  reference: string
): Promise<{ ok: true; status: CheckerStatus; batchRef: string; quantity: number; raw: any } | { ok: false; error: string }> {
  if (providerMode("resultchecker") === "dry") return { ok: true, status: "delivered", batchRef: "DRY", quantity: 1, raw: { dry: true } };
  try {
    const { status, data } = await call({ func: "GetCheckerStatus", prod: "resultchecker", extRef: reference });
    if (accepted(status, data)) {
      const d = payload(data);
      return { ok: true, status: normalizeStatus(d.status), batchRef: String(d.batch_ref || ""), quantity: Number(d.quantity || 0), raw: data };
    }
    return { ok: false, error: errorOf(data, status) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach Muviin" };
  }
}
