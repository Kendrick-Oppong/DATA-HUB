// HubNet Ghana — data-bundle fulfillment provider adapter. SERVER ONLY.
//
// LEGACY / RECONCILE-ONLY. Data fulfilment moved to DataHub Ghana (providers/datahub.ts) and
// nothing routes a NEW order here any more. This adapter stays because it is the only thing
// that can settle the orders HubNet already took — providers/data.ts routes reconciliation on
// the `provider` stored on each order, so deleting this file would strand them. purchase() is
// still wired up so the routing can be flipped back in one line if DataHub has an outage.
//
// The only place that talks to HubNet's HTTP API. Everything else (order routes,
// webhooks) speaks to this normalized interface, so another provider could slot in
// behind the same shape later.
//
// API: https://console.hubnet.app/live/api/context/business/transaction
// Docs: HubNet Mobile Data API v1.0 (console.hubnet.app)
//
// Config (.env.local):
//   HUBNET_API_KEY           secret key from console.hubnet.app (blank → forces dry mode)
//   HUBNET_BASE_URL          default https://console.hubnet.app/live/api/context/business/transaction
//   HUBNET_MODE              live | dry  (defaults to dry when no key)
//   APP_BASE_URL             public origin — used to build the per-transaction webhook URL
//   HUBNET_WEBHOOK_SECRET    optional; appended to the webhook URL and checked on callback
//
// Notes on HubNet's model (verified against live API v4.0.22.x):
//   * Auth uses a "token" HTTP header (NOT Authorization): `token: Bearer <KEY>`.
//   * Responses: success is { event:"*.success", status:"success" (STRING), data:{…} };
//     business rejections are { event:"charge.rejected", code, status:"failed", message };
//     field validation errors are a BARE JSON string body ("Phone number is required…").
//     The account must be APPROVED BY HUBNET for API transactions — an unapproved account
//     passes validation but is rejected with code 406 "…not eligible for this service…".
//   * Volume is expressed in MB as a string (2GB → "2000"). GB→MB is ×1000. Min 1000MB.
//   * `reference` is OUR unique id (6–25 chars) — HubNet echoes it back on the status
//     endpoint and in webhooks, so we correlate by our own order ref (no providerRef
//     lookup needed). We still store HubNet's transaction_id as providerRef for support.
//   * Unlike DataHub, HubNet DOES expose a live status-check GET and a balance GET, so
//     the polling reconciler in /api/orders/[ref] can settle a stuck order.
//   * Rate limit: 5 requests/minute per endpoint.

import type { OrderStatus } from "@/lib/orderStatus";
import type { AtProduct, ProductLine } from "./lines";

const KEY = process.env.HUBNET_API_KEY || "";
const BASE = (process.env.HUBNET_BASE_URL || "https://console.hubnet.app/live/api/context/business/transaction").replace(/\/+$/, "");
const MODE = (process.env.HUBNET_MODE || (KEY ? "live" : "dry")).toLowerCase();

// Longest we'll wait on HubNet before giving up on a single call.
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 12000);

export function providerMode(): "live" | "dry" {
  return MODE === "live" && KEY ? "live" : "dry";
}

// SDH network id (+ AT product line) → HubNet URL network token.
//   mtn → mtn, telecel → telecel
//   atigo → at (iShare / standard) | big-time (BigTime bulk, never expires)
export type { AtProduct };
export function toNetworkCode(net: string, atProduct?: ProductLine | null): string | null {
  switch (net) {
    case "mtn":
      return "mtn";
    case "telecel":
      return "telecel";
    case "atigo":
      return atProduct === "bigtime" ? "big-time" : "at"; // default AT line: iShare (at)
    default:
      return null;
  }
}

// HubNet status strings → our order vocabulary (see lib/orderStatus.ts for the full map).
// HubNet's own lifecycle is: Accepted → In Progress → Completed (or failed / cancelled).
export type { OrderStatus };
export function normalizeStatus(raw: string): OrderStatus {
  // "In Progress", "in-progress" and "in_progress" are the same state.
  const s = String(raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (["delivered", "successful", "success", "completed", "complete"].includes(s)) return "delivered";
  if (["refunded", "refund"].includes(s)) return "refunded";
  if (["failed", "error", "cancelled", "canceled", "declined", "rejected"].includes(s)) return "failed";
  // Accepted by HubNet but not started — the customer sees "Waiting".
  if (["accepted", "queued", "pending", "new", "submitted", "waiting"].includes(s)) return "waiting";
  return "processing"; // in progress / processing / anything unknown → actively in flight
}

// Per-transaction webhook URL (HubNet POSTs status changes here). Built from APP_BASE_URL
// so we don't depend on a console-configured webhook. Undefined if no public origin is set
// (the status-check poller still reconciles the order in that case).
function webhookUrl(): string | undefined {
  const origin = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
  if (!origin || !/^https:\/\//i.test(origin)) return undefined; // HubNet requires a valid HTTPS URL
  const secret = process.env.HUBNET_WEBHOOK_SECRET || "";
  return `${origin}/api/webhooks/hubnet${secret ? `?token=${encodeURIComponent(secret)}` : ""}`;
}

async function call(
  path: string,
  init?: RequestInit
): Promise<{ status: number; data: any }> {
  // Hard timeout: a provider that stops answering must never hold a request open.
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    ...init,
    headers: {
      // HubNet authenticates via the "token" header (Bearer scheme), not Authorization.
      token: "Bearer " + KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// A HubNet response succeeded when HTTP is 2xx AND the payload reports success. The live v4
// API reports success as status:"success" (a STRING) with an event like "transaction.success"
// / "query.success"; a rejection is status:"failed" / event:"charge.rejected" with a
// { code, message }. (Older builds used status:true / machine code "0000" — accept those too.)
function payloadOk(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  const s = String(data.status ?? "").toLowerCase();
  const ev = String(data.event ?? "").toLowerCase();
  return s === "success" || data.status === true || ev.endsWith(".success") || data.code === "0000";
}
function accepted(status: number, data: any): boolean {
  return status >= 200 && status < 300 && payloadOk(data);
}

// Pull the human reason out of a rejection. v4 VALIDATION errors come back as a BARE JSON
// string (e.g. "Phone number is required & must be 10 digits!"); BUSINESS rejections use
// { message } (e.g. the "not eligible for this service" account-approval gate).
function hubnetError(status: number, data: any): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  const m = data?.message;
  if (typeof m === "string" && m && m !== "0000") return m;
  const nested = data?.data?.message;
  if (typeof nested === "string" && nested) return nested;
  return data?.reason || data?.error || `Request failed (${status})`;
}

// ---- Purchase a bundle ----
export interface PurchaseInput {
  phoneNumber: string;          // recipient, 10 digits starting with 0 (e.g. "0541234567")
  network: string;              // SDH id: mtn | telecel | atigo
  atProduct?: ProductLine | null; // product line — see providers/lines.ts
  capacityGb: number;           // bundle size in GB
  reference: string;            // our order id — HubNet echoes it back (must be 6–25 chars, unique)
}
export async function purchase(
  input: PurchaseInput
): Promise<
  { ok: true; providerRef: string; status: OrderStatus; raw: any } | { ok: false; error: string; raw?: any }
> {
  const code = toNetworkCode(input.network, input.atProduct);
  if (!code) return { ok: false, error: `Unsupported network: ${input.network}` };

  if (providerMode() === "dry") {
    // Simulate an accepted, in-flight order. The webhook/reconciler will "deliver" it.
    return { ok: true, providerRef: "DRY-" + input.reference, status: "waiting", raw: { dry: true } };
  }

  const volumeMb = Math.round(input.capacityGb * 1000); // GB → MB
  const wh = webhookUrl();
  const body = {
    phone: input.phoneNumber,
    volume: String(volumeMb),
    reference: input.reference,
    ...(wh ? { webhook: wh } : {}),
  };

  try {
    const { status, data } = await call(`/${code}-new-transaction`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (accepted(status, data)) {
      // Store HubNet's own transaction id for support/reconciliation; fall back to our ref.
      // v4 nests the payload under `data`; older builds put ids at the top level.
      const d = (data && data.data) || {};
      const providerRef = String(
        d.transaction_id ?? d.payment_id ?? d.reference ?? data?.transaction_id ?? data?.reference ?? input.reference
      );
      // On acceptance the bundle is only QUEUED ("Accepted" → our "waiting") — it moves to
      // "processing" when HubNet starts sending and settles to delivered/failed via the
      // webhook or the status-check poller. data.data.status may already say more.
      return { ok: true, providerRef, status: normalizeStatus(d.status || "accepted"), raw: data };
    }
    // Surface the real reason (account not approved for the API, insufficient HubNet balance,
    // duplicate reference, bad volume, rate limit…) in the server terminal — the client gets
    // a generic message.
    console.error(
      `HubNet purchase rejected [${status}] ${code} ${input.capacityGb}GB → ${input.phoneNumber}:`,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return { ok: false, error: hubnetError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach HubNet", raw: null };
  }
}

// ---- Order status (reconciliation / polling fallback) ----
// HubNet's universal GET status lookup: /check-transaction-status?reference=<ourRef>.
// Returns { status:true, message:"0000", data:{ status, message } }.
export async function orderStatus(
  reference: string
): Promise<{ ok: true; status: OrderStatus; raw: any } | { ok: false; error: string; raw?: any }> {
  if (providerMode() === "dry") return { ok: true, status: "delivered", raw: { dry: true } };
  try {
    const { status, data } = await call(
      `/check-transaction-status?reference=${encodeURIComponent(reference)}`,
      { method: "GET" }
    );
    if (accepted(status, data)) {
      const d = (data && data.data) || {};
      const st = d.status ?? d.state ?? d.transaction_status ?? d.delivery_status;
      // No status field → HubNet told us nothing new. Report the EARLIEST in-flight state
      // ("waiting") rather than "processing": applyStatus never moves an order backwards,
      // so a no-information poll leaves the order exactly where it was.
      return { ok: true, status: normalizeStatus(st || "accepted"), raw: data };
    }
    // Unknown reference / not found yet → no new info, keep it where it is (see above).
    return { ok: true, status: "waiting", raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach HubNet", raw: null };
  }
}

// ---- Balance ----
// HubNet exposes a real wallet balance GET. { status:true, balance, currency }.
export async function balance(): Promise<
  { ok: true; balance: number; raw: any } | { ok: false; error: string; raw?: any }
> {
  if (providerMode() === "dry") return { ok: true, balance: 100000, raw: { dry: true } };
  try {
    const { status, data } = await call("/check_balance", { method: "GET" });
    if (accepted(status, data)) {
      // v4: { data: { wallet_balance } }; older: { balance }.
      const d = (data && data.data) || {};
      const bal = d.wallet_balance ?? d.balance ?? data?.balance ?? 0;
      return { ok: true, balance: Number(bal), raw: data };
    }
    return { ok: false, error: hubnetError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach HubNet", raw: null };
  }
}
