// DataHub Ghana — data-bundle fulfillment provider adapter. SERVER ONLY.
// The only place that talks to DataHub's HTTP API. Exposes the SAME normalized shape as the
// other data adapters (purchase / orderStatus / balance), so providers/data.ts can route a
// network here or elsewhere without any caller noticing.
//
// DataHub is the CURRENT provider for every data network (MTN, Telecel, AT). HubNet and
// GHDataConnect stay in the tree only to reconcile orders they already took.
//
// API:  https://user.datahubgh.com/api/external   (docs: user.datahubgh.com/docs/api, v3.0.0)
//   POST /data-purchase      { networkKey, recipient, capacity, reference }
//   POST /voucher-purchase   { VoucherType, Recipient, Quantity }   — WASSCE/BECE checkers
//   GET  /order-status?reference=<ourRef>          (also accepts ?orderNumber=)
//   GET  /balance
//   Auth: X-API-Key: <key>   (NOT Authorization/Bearer)
//   Rate limit: 100 requests/minute per key.
//
// Config (.env.local):
//   DATAHUB_API_KEY        secret key from user.datahubgh.com/api-keys (blank → dry mode)
//   DATAHUB_BASE_URL       default https://user.datahubgh.com/api/external
//   DATAHUB_MODE           live | dry  (defaults to dry when no key)
//   DATAHUB_WEBHOOK_SECRET the HMAC secret set on the webhook in DataHub's dashboard
//
// Notes on their model:
//   * `capacity` is the bundle size in GB, sent as a STRING ("5"). Do NOT convert to MB —
//     that's HubNet's unit. DataHub matches it against its own published bundle sizes and
//     rejects anything it doesn't sell ("No bundle found for 10GB on MTN").
//   * `reference` is OUR order ref; it's echoed back and is what /order-status is keyed on,
//     so we correlate on our own ref exactly as with the other providers.
//   * A purchase DEBITS OUR DATAHUB WALLET immediately and returns what it charged
//     (`data.price`, plus a balance before/after). We record that as the order's cost so the
//     tier bonus is computed against what the platform really paid (see tierPayouts.ts).
//   * Every response is { success: boolean, ... } with an `error` string on failure.
//   * Webhooks are configured per API KEY in DataHub's dashboard (not per transaction), so
//     there's no callback URL to send here — see app/api/webhooks/datahub/route.ts.

import type { OrderStatus } from "@/lib/orderStatus";
import { defaultLine, type ProductLine } from "./lines";

const KEY = process.env.DATAHUB_API_KEY || "";
const BASE = (process.env.DATAHUB_BASE_URL || "https://user.datahubgh.com/api/external").replace(/\/+$/, "");
const MODE = (process.env.DATAHUB_MODE || (KEY ? "live" : "dry")).toLowerCase();

// Longest we'll wait on DataHub before giving up on a single call.
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 12000);

export function providerMode(): "live" | "dry" {
  return MODE === "live" && KEY ? "live" : "dry";
}

// SDH network id (+ product line) → DataHub networkKey.
//   mtn     → YELLO (standard) | MTN_XPRESS (express delivery)
//   telecel → TELECEL
//   atigo   → AT_PREMIUM (iShare, instant) | AT_BIGTIME (bulk, never expires)
export function toNetworkKey(net: string, line?: ProductLine | null): string | null {
  const l = line || defaultLine(net);
  switch (net) {
    case "mtn":
      return l === "xpress" ? "MTN_XPRESS" : "YELLO";
    case "telecel":
      return "TELECEL";
    case "atigo":
      return l === "bigtime" ? "AT_BIGTIME" : "AT_PREMIUM";
    default:
      return null;
  }
}

// DataHub order statuses → our order vocabulary (see lib/orderStatus.ts).
// Theirs: INITIATED → PENDING → PROCESSING → SUCCESSFUL | FAILED | CANCELLED.
export function normalizeStatus(raw: string): OrderStatus {
  const s = String(raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (["successful", "success", "completed", "complete", "delivered"].includes(s)) return "delivered";
  if (["refunded", "refund", "reversed"].includes(s)) return "refunded";
  if (["failed", "error", "cancelled", "canceled", "declined", "rejected"].includes(s)) return "failed";
  // Taken but not started — the customer sees "Waiting".
  if (["initiated", "pending", "accepted", "queued", "new", "submitted", "waiting"].includes(s)) return "waiting";
  return "processing"; // PROCESSING / anything unknown → actively in flight
}

async function call(path: string, init?: RequestInit): Promise<{ status: number; data: any }> {
  // Hard timeout: a provider that stops answering must never hold a request open.
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    ...init,
    headers: {
      // DataHub authenticates on X-API-Key. There is no Authorization header.
      "X-API-Key": KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const accepted = (status: number, data: any) =>
  status >= 200 && status < 300 && !!data && data.success === true;

// Pull the human reason out of a rejection. DataHub is consistent: { success:false, error }.
function datahubError(status: number, data: any): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  const m = data?.error ?? data?.message ?? data?.data?.error;
  if (typeof m === "string" && m) return m;
  if (status === 429) return "Too many requests — please try again in a moment.";
  return `Request failed (${status})`;
}

// ---- Purchase a bundle ----
export interface PurchaseInput {
  phoneNumber: string;        // recipient, 10 digits starting with 0 (e.g. "0541234567")
  network: string;            // SDH id: mtn | telecel | atigo
  atProduct?: ProductLine | null; // product line — see providers/lines.ts on the name
  capacityGb: number;         // bundle size in GB — sent as-is, they expect GB
  reference: string;          // our order ref; echoed back and keyed on by /order-status
}
export async function purchase(
  input: PurchaseInput
): Promise<
  | { ok: true; providerRef: string; status: OrderStatus; cost: number | null; raw: any }
  | { ok: false; error: string; raw?: any }
> {
  const networkKey = toNetworkKey(input.network, input.atProduct);
  if (!networkKey) return { ok: false, error: `Unsupported network: ${input.network}` };

  const capacity = Number(input.capacityGb);
  if (!(capacity > 0)) return { ok: false, error: "Invalid bundle size." };

  if (providerMode() === "dry") {
    // Simulate an accepted, in-flight order. The webhook/reconciler will "deliver" it.
    return { ok: true, providerRef: "DRY-" + input.reference, status: "waiting", cost: null, raw: { dry: true } };
  }

  try {
    const { status, data } = await call("/data-purchase", {
      method: "POST",
      body: JSON.stringify({
        networkKey,
        recipient: input.phoneNumber,
        capacity: String(capacity),
        reference: input.reference,
      }),
    });
    if (accepted(status, data)) {
      const d = data.data || {};
      // Their order number is the support handle; the reference is ours either way.
      const providerRef = String(d.orderNumber ?? d.reference ?? input.reference);
      // What this order actually cost US — prefer the wallet debit, fall back to the quoted
      // price. Recorded on the order so a tier bonus can never exceed the real margin.
      const debited = Number(data?.balance?.deducted);
      const quoted = Number(d.price);
      const cost = Number.isFinite(debited) && debited > 0 ? debited
        : Number.isFinite(quoted) && quoted > 0 ? quoted
        : null;
      // Acceptance means QUEUED, not sent — the webhook or the status poller settles it.
      return { ok: true, providerRef, status: normalizeStatus(d.status || "pending"), cost, raw: data };
    }
    // Surface the real reason (insufficient DataHub wallet, unknown bundle size, duplicate
    // reference, rate limit…) in the server log — the client gets a generic message.
    console.error(
      `DataHub purchase rejected [${status}] ${networkKey} ${capacity}GB → ${input.phoneNumber}:`,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return { ok: false, error: datahubError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach DataHub", raw: null };
  }
}

// ---- Order status (reconciliation / polling fallback) ----
// Keyed on OUR reference, same as the other providers, so the existing reconcilers work
// unchanged. DataHub asks that this be polled no more than once every 30–60s per order.
export async function orderStatus(
  reference: string
): Promise<{ ok: true; status: OrderStatus; raw: any } | { ok: false; error: string; raw?: any }> {
  if (providerMode() === "dry") return { ok: true, status: "delivered", raw: { dry: true } };
  try {
    const { status, data } = await call(
      `/order-status?reference=${encodeURIComponent(reference)}`,
      { method: "GET" }
    );
    if (accepted(status, data)) {
      const d = data.data || {};
      return { ok: true, status: normalizeStatus(d.status || "pending"), raw: data };
    }
    // Unknown reference / not visible yet → no new information. "waiting" is the earliest
    // in-flight state and applyStatus never moves an order backwards, so reporting it is a
    // no-op rather than a false claim that delivery has started.
    return { ok: true, status: "waiting", raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach DataHub", raw: null };
  }
}

// ---- Result-checker vouchers (WASSCE / BECE) ----
// POST /voucher-purchase   { VoucherType, Recipient, Quantity }
// Unlike a data purchase, this is FULLY SYNCHRONOUS: the PIN + serial for every voucher come
// back in the same response — there's no batch_ref, no polling, no webhook to wait on. That
// replaces Muviin's flow, where BuyChecker only returned a batch reference and an admin had
// to read the actual PIN/serial off Muviin's own portal and paste them in by hand.

// SDH checker product id → DataHub VoucherType. Only WASSCE & BECE are supported.
export function toVoucherType(productId: string): "WASSCE" | "BECE" | null {
  if (productId === "wassce") return "WASSCE";
  if (productId === "bece") return "BECE";
  return null;
}

export interface VoucherResult {
  serial: string;
  pin: string;
  type: string;
  price: number;
  purchasedAt: string;
}
export interface VoucherPurchaseInput {
  productId: string;   // wassce | bece
  recipient: string;   // 10-digit local number, starting with 0
  quantity?: number;   // 1–100, default 1
}
export async function voucherPurchase(
  input: VoucherPurchaseInput
): Promise<
  | { ok: true; vouchers: VoucherResult[]; totalCost: number; raw: any }
  | { ok: false; error: string; raw?: any }
> {
  const voucherType = toVoucherType(input.productId);
  if (!voucherType) return { ok: false, error: `Unsupported checker type: ${input.productId}` };
  const quantity = Math.max(1, Math.min(100, Math.floor(input.quantity || 1)));

  if (providerMode() === "dry") {
    const purchasedAt = new Date().toISOString();
    const vouchers: VoucherResult[] = Array.from({ length: quantity }, (_, i) => ({
      serial: `DRY-SER-${Date.now()}-${i}`,
      pin: `DRY-PIN-${i}`,
      type: voucherType,
      price: 0,
      purchasedAt,
    }));
    return { ok: true, vouchers, totalCost: 0, raw: { dry: true } };
  }

  try {
    const { status, data } = await call("/voucher-purchase", {
      method: "POST",
      body: JSON.stringify({ VoucherType: voucherType, Recipient: input.recipient, Quantity: quantity }),
    });
    if (accepted(status, data)) {
      const vouchers: VoucherResult[] = Array.isArray(data.vouchers) ? data.vouchers : [];
      const totalCost = vouchers.reduce((sum: number, v: any) => sum + (Number(v.price) || 0), 0);
      return { ok: true, vouchers, totalCost, raw: data };
    }
    console.error(
      `DataHub voucher purchase rejected [${status}] ${voucherType} x${quantity} → ${input.recipient}:`,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return { ok: false, error: datahubError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach DataHub", raw: null };
  }
}

// ---- Balance ----
// Our DataHub wallet — every purchase debits it, so an empty wallet stops fulfilment.
export async function balance(): Promise<
  { ok: true; balance: number; raw: any } | { ok: false; error: string; raw?: any }
> {
  if (providerMode() === "dry") return { ok: true, balance: 100000, raw: { dry: true } };
  try {
    const { status, data } = await call("/balance", { method: "GET" });
    if (accepted(status, data)) return { ok: true, balance: Number(data.data?.balance ?? 0), raw: data };
    return { ok: false, error: datahubError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach DataHub", raw: null };
  }
}
