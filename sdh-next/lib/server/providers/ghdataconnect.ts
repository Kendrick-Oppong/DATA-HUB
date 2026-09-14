// GHDataConnect — data-bundle fulfillment provider adapter. SERVER ONLY.
//
// LEGACY / RECONCILE-ONLY, exactly like hubnet.ts: data fulfilment moved to DataHub Ghana
// (providers/datahub.ts). Kept so the orders GHDataConnect already took can still be settled.
// The only place that talks to GHDataConnect's HTTP API. Exposes the SAME normalized shape
// as hubnet.ts (purchase / orderStatus / balance), so routing a network from one provider to
// the other is a one-line change in providers/data.ts.
//
// We use GHDataConnect for TELECEL and AT (iShare + BigTime); MTN stays on HubNet.
//
// API: https://ghdataconnect.com/api
//   POST /v1/purchaseBundle              { network, reference, msisdn, capacity }
//   GET  /v1/checkOrderStatus/:reference
//   GET  /v1/getWalletBalance
//   GET  /v1/getAllNetworks
//   Auth: Authorization: Bearer <API key>  (generated from the dashboard profile)
//
// Config (.env.local):
//   GHDC_API_KEY    secret bearer token (blank → forces dry mode)
//   GHDC_BASE_URL   default https://ghdataconnect.com/api
//   GHDC_MODE       live | dry  (defaults to dry when no key)
//
// Notes on their model:
//   * `capacity` is in GB on /v1/purchaseBundle (their example: capacity 1 → price 4.10),
//     unlike HubNet which wants MB. Do NOT multiply by 1000 here.
//   * `reference` is OUR id and is what the status endpoint is keyed on, so we correlate on
//     our own order ref exactly as we do with HubNet. The response echoes it back.
//   * There is a separate POST /v1/createIshareBundleOrder that takes capacity in MB. We
//     don't use it: /v1/purchaseBundle already covers iShare via network "atishare", and
//     that endpoint returns no response body, so there'd be nothing to confirm against.
//   * Responses are { success: boolean, message?, data? }. A placed order comes back
//     status "pending"; the status endpoint reports the final state.
//   * No webhook is documented, so delivery is settled by polling checkOrderStatus — the
//     same reconcilers that already back up HubNet.
import type { OrderStatus } from "@/lib/orderStatus";
import type { ProductLine } from "./lines";

const KEY = process.env.GHDC_API_KEY || "";
const BASE = (process.env.GHDC_BASE_URL || "https://ghdataconnect.com/api").replace(/\/+$/, "");
const MODE = (process.env.GHDC_MODE || (KEY ? "live" : "dry")).toLowerCase();

// Longest we'll wait on GHDataConnect before giving up on a single call.
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 12000);

export function providerMode(): "live" | "dry" {
  return MODE === "live" && KEY ? "live" : "dry";
}

// SDH network id (+ AT product line) → GHDataConnect network key.
//   telecel → telecel
//   atigo   → atishare (default AT line) | atbigtime
//   mtn     → mtn (supported by them, but we fulfil MTN through HubNet — see providers/data.ts)
export function toNetworkKey(net: string, atProduct?: ProductLine | null): string | null {
  switch (net) {
    case "mtn": return "mtn";
    case "telecel": return "telecel";
    case "atigo": return atProduct === "bigtime" ? "atbigtime" : "atishare";
    default: return null;
  }
}

// Their status strings → our order vocabulary. Seen: pending. Treat anything unknown as
// still in flight so a stuck order is never silently marked delivered.
export function normalizeStatus(raw: string): OrderStatus {
  const s = String(raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (["delivered", "completed", "complete", "success", "successful", "fulfilled"].includes(s)) return "delivered";
  if (["refunded", "refund", "reversed"].includes(s)) return "refunded";
  if (["failed", "error", "cancelled", "canceled", "declined", "rejected"].includes(s)) return "failed";
  // Accepted but not started — same "Waiting" stage HubNet calls "Accepted".
  if (["accepted", "queued", "pending", "new", "submitted", "waiting"].includes(s)) return "waiting";
  return "processing"; // in progress / processing / unknown
}

async function call(path: string, init?: RequestInit): Promise<{ status: number; data: any }> {
  // Hard timeout: a provider that stops answering must never hold a request open.
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    ...init,
    headers: {
      Authorization: "Bearer " + KEY,
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

function ghdcError(status: number, data: any): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  const m = data?.message ?? data?.error ?? data?.data?.message;
  if (typeof m === "string" && m) return m;
  return `Request failed (${status})`;
}

// ---- Purchase a bundle ----
export interface PurchaseInput {
  phoneNumber: string;          // recipient, 10 digits starting with 0
  network: string;              // SDH id: telecel | atigo (mtn accepted but routed to HubNet)
  atProduct?: ProductLine | null; // product line — see providers/lines.ts
  capacityGb: number;           // bundle size in GB — sent as-is, they expect GB
  reference: string;            // our order id; echoed back and used for status lookups
}
export async function purchase(
  input: PurchaseInput
): Promise<
  | { ok: true; providerRef: string; status: OrderStatus; cost: number | null; raw: any }
  | { ok: false; error: string; raw?: any }
> {
  const network = toNetworkKey(input.network, input.atProduct);
  if (!network) return { ok: false, error: `Unsupported network: ${input.network}` };

  const capacity = Number(input.capacityGb);
  if (!(capacity > 0)) return { ok: false, error: "Invalid bundle size." };

  if (providerMode() === "dry") {
    return { ok: true, providerRef: "DRY-" + input.reference, status: "waiting", cost: null, raw: { dry: true } };
  }

  try {
    const { status, data } = await call("/v1/purchaseBundle", {
      method: "POST",
      body: JSON.stringify({
        network,
        reference: input.reference,
        msisdn: input.phoneNumber,
        capacity,
      }),
    });
    if (accepted(status, data)) {
      const d = data.data || {};
      // They have no separate transaction id in the place-order response — the reference IS
      // the handle, so store ours (which is what checkOrderStatus is keyed on anyway).
      return {
        ok: true,
        providerRef: String(d.reference || input.reference),
        status: normalizeStatus(d.status || "pending"),
        // What this order actually cost US. Recorded on the order so the tier bonus can
        // never pay out more than the platform really earned (see tierPayouts.ts).
        cost: Number.isFinite(Number(d.price)) ? Number(d.price) : null,
        raw: data,
      };
    }
    console.error(
      `GHDataConnect purchase rejected [${status}] ${network} ${capacity}GB → ${input.phoneNumber}:`,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return { ok: false, error: ghdcError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach GHDataConnect", raw: null };
  }
}

// ---- Order status (reconciliation / polling) ----
// Keyed on OUR reference, same as HubNet, so the existing reconcilers work unchanged.
export async function orderStatus(
  reference: string
): Promise<{ ok: true; status: OrderStatus; raw: any } | { ok: false; error: string; raw?: any }> {
  if (providerMode() === "dry") return { ok: true, status: "delivered", raw: { dry: true } };
  try {
    const { status, data } = await call(`/v1/checkOrderStatus/${encodeURIComponent(reference)}`, { method: "GET" });
    if (accepted(status, data)) {
      const d = data.data || {};
      // `delivered_at` is the harder fact than the status string — if it's set, it's delivered.
      if (d.delivered_at) return { ok: true, status: "delivered", raw: data };
      return { ok: true, status: normalizeStatus(d.status || "pending"), raw: data };
    }
    // Unknown reference / not visible yet → no new information. "waiting" is the earliest
    // in-flight state and applyStatus never moves an order backwards, so this is a no-op
    // rather than a false claim that delivery has started.
    return { ok: true, status: "waiting", raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach GHDataConnect", raw: null };
  }
}

// ---- Balance ----
export async function balance(): Promise<
  { ok: true; balance: number; raw: any } | { ok: false; error: string; raw?: any }
> {
  if (providerMode() === "dry") return { ok: true, balance: 100000, raw: { dry: true } };
  try {
    const { status, data } = await call("/v1/getWalletBalance", { method: "GET" });
    if (accepted(status, data)) return { ok: true, balance: Number(data.data?.balance ?? 0), raw: data };
    return { ok: false, error: ghdcError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach GHDataConnect", raw: null };
  }
}

// ---- Their published catalogue (admin reference only; never used to price a charge) ----
export async function allNetworks(): Promise<
  { ok: true; networks: any[]; raw: any } | { ok: false; error: string; raw?: any }
> {
  if (providerMode() === "dry") return { ok: true, networks: [], raw: { dry: true } };
  try {
    const { status, data } = await call("/v1/getAllNetworks", { method: "GET" });
    if (accepted(status, data)) return { ok: true, networks: Array.isArray(data.data) ? data.data : [], raw: data };
    return { ok: false, error: ghdcError(status, data), raw: data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not reach GHDataConnect", raw: null };
  }
}
