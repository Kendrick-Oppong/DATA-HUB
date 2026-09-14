// Admin-managed data-bundle pricing — the persisted source of truth. SERVER ONLY.
//
// DataHub has no price-list API (only /balance and /order-status), so prices can't be synced
// live from the vendor — admins manage them here and Publish saves this doc.
// Every real charge (customer buy, agent storefront) prices from this store, so publishing
// reflects everywhere. Cached in-process for a short TTL to avoid a DB read per purchase.
import { getConfig } from "./db";
import type { ProductLine } from "./providers/lines";

// A bundle always carries a validity: either a day count or "never expires".
export interface PricingBundle {
  id: string;           // stable id (e.g. "d5")
  gb: number;
  days: number;         // validity in days; 0 when noExpiry
  noExpiry: boolean;    // never-expires bundle (e.g. AT BigTime)
  retail: number;       // what a customer pays
  wholesale: number;    // what the platform/agent pays (our provider cost) — commission = retail − wholesale
}

// A vendor (DataHub) bundle — a reference list of what DataHub actually offers/charges, shown
// beside our pricing so admins can keep wholesale in sync. Editable (no vendor price API).
export interface VendorBundle {
  id: string;
  gb: number;
  days: number;
  noExpiry: boolean;
  price: number;        // the vendor's price (our cost)
}

// Networks/product LINES are keyed separately so each line prices independently: MTN
// standard vs MTN Xpress (express delivery), and AT iShare vs BigTime.
export type PricingKey = "mtn" | "mtn_xpress" | "telecel" | "atigo_ishare" | "atigo_bigtime";
export const PRICING_KEYS: PricingKey[] = ["mtn", "mtn_xpress", "telecel", "atigo_ishare", "atigo_bigtime"];
export interface DataPricing {
  mtn: PricingBundle[];
  mtn_xpress: PricingBundle[];
  telecel: PricingBundle[];
  atigo_ishare: PricingBundle[];
  atigo_bigtime: PricingBundle[];
  vendor?: Record<PricingKey, VendorBundle[]>;   // vendor reference catalog (editable)
  updatedAt?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---- Default seed (used until an admin publishes) — mirrors the original catalog. ----
const BASE = [
  { id: "d1", gb: 1, days: 30, retail: 5.5, wholesale: 5.0 },
  { id: "d2", gb: 2, days: 30, retail: 10.5, wholesale: 9.6 },
  { id: "d3", gb: 3, days: 30, retail: 15.0, wholesale: 13.8 },
  { id: "d5", gb: 5, days: 30, retail: 23.0, wholesale: 21.2 },
  { id: "d10", gb: 10, days: 30, retail: 43.0, wholesale: 39.5 },
  { id: "d15", gb: 15, days: 30, retail: 62.0, wholesale: 57.0 },
  { id: "d20", gb: 20, days: 30, retail: 80.0, wholesale: 73.5 },
  { id: "d50", gb: 50, days: 90, retail: 180.0, wholesale: 166.0 },
  { id: "d100", gb: 100, days: 90, retail: 330.0, wholesale: 305.0 },
];
const NET_ADJ: Record<string, number> = { mtn: 0, telecel: -0.4, atigo: 0.3 };
const BIGTIME_PREMIUM = 0.08;   // AT BigTime: paid for never expiring
const XPRESS_PREMIUM = 0.06;    // MTN Xpress: paid for express delivery

// `premium` is a fraction added to both retail and wholesale — it's only a SEED, so admins
// can publish whatever the vendor actually charges over the top of it.
function seedFor(net: string, big: boolean, premium = 0): PricingBundle[] {
  const adj = NET_ADJ[net] || 0;
  const rate = big ? BIGTIME_PREMIUM : premium;
  return BASE.map((b) => {
    const prem = rate ? round2(b.retail * rate) : 0;
    return {
      id: b.id,
      gb: b.gb,
      days: big ? 0 : b.days,
      noExpiry: big,
      retail: Math.max(0, round2(b.retail + adj + prem)),
      wholesale: Math.max(0, round2(b.wholesale + adj + prem)),
    };
  });
}

// ---- Vendor reference catalog default ----
// Real MTN (MTNUP2U, 90-day) prices carried over from the previous vendor dashboard; other
// lines seed from the wholesale seed as a starting point (admins correct them against the
// vendor's own price list).
const MTN_VENDOR: Array<[number, number]> = [
  [1, 4.2], [2, 8], [3, 12], [4, 16], [5, 20], [6, 24], [8, 32], [10, 38.5],
  [15, 57], [20, 76], [25, 96], [30, 115], [40, 152], [50, 190], [100, 380],
];
function seedVendor(net: string, big: boolean, mtnReal = false, premium = 0): VendorBundle[] {
  if (mtnReal) {
    return MTN_VENDOR.map(([gb, price]) => ({
      id: "v" + gb, gb, days: 90, noExpiry: false,
      price: round2(price * (1 + premium)),
    }));
  }
  return seedFor(net, big, premium).map((b) => ({ id: "v" + b.gb, gb: b.gb, days: b.days, noExpiry: b.noExpiry, price: b.wholesale }));
}

export function defaultPricing(): DataPricing {
  return {
    mtn: seedFor("mtn", false),
    mtn_xpress: seedFor("mtn", false, XPRESS_PREMIUM),
    telecel: seedFor("telecel", false),
    atigo_ishare: seedFor("atigo", false),
    atigo_bigtime: seedFor("atigo", true),
    vendor: {
      mtn: seedVendor("mtn", false, true),
      mtn_xpress: seedVendor("mtn", false, true, XPRESS_PREMIUM),
      telecel: seedVendor("telecel", false),
      atigo_ishare: seedVendor("atigo", false),
      atigo_bigtime: seedVendor("atigo", true),
    },
  };
}

// Map (network, product line) → the pricing key. `line` is the `atProduct` field carried on
// orders and quotes — see providers/lines.ts on why it still has that name.
export function pricingKeyOf(net: string, line?: ProductLine | null): PricingKey | null {
  if (net === "mtn") return line === "xpress" ? "mtn_xpress" : "mtn";
  if (net === "telecel") return "telecel";
  if (net === "atigo") return line === "bigtime" ? "atigo_bigtime" : "atigo_ishare";
  return null;
}

// Normalize/validate an incoming published config — clamps numbers, keeps every line key.
// A key the stored doc predates (e.g. mtn_xpress on a config published before MTN Xpress
// existed) falls back to its seed rather than coming back empty.
function sanitize(input: any): DataPricing {
  const keys = PRICING_KEYS;
  const out: any = {};
  const def = defaultPricing();
  for (const k of keys) {
    const arr = Array.isArray(input?.[k]) ? input[k] : def[k];
    out[k] = arr
      .map((b: any, i: number) => {
        // `noValidity` was a third mode that's been removed — any bundle still carrying it
        // (or a 0-day one) is a never-expires bundle now.
        const days = Math.max(0, Math.floor(Number(b.days) || 0));
        const noExpiry = !!b.noExpiry || !!b.noValidity || days === 0;
        const gb = Math.max(0, Number(b.gb) || 0);
        return {
          id: String(b.id || "d" + gb || "b" + i),
          gb,
          days: noExpiry ? 0 : days,
          noExpiry,
          retail: Math.max(0, round2(Number(b.retail) || 0)),
          wholesale: Math.max(0, round2(Number(b.wholesale) || 0)),
        } as PricingBundle;
      })
      .filter((b: PricingBundle) => b.gb > 0);
  }
  // Vendor reference catalog (editable; doesn't affect charges).
  const vin = input?.vendor || {};
  out.vendor = {};
  for (const k of keys) {
    const arr = Array.isArray(vin[k]) ? vin[k] : (def.vendor as any)[k];
    out.vendor[k] = arr
      .map((b: any, i: number) => {
        const noExpiry = !!b.noExpiry;
        const gb = Math.max(0, Number(b.gb) || 0);
        return { id: String(b.id || "v" + gb || "v" + i), gb, days: noExpiry ? 0 : Math.max(0, Math.floor(Number(b.days) || 0)), noExpiry, price: Math.max(0, round2(Number(b.price) || 0)) } as VendorBundle;
      })
      .filter((b: VendorBundle) => b.gb > 0);
  }
  out.updatedAt = Date.now();
  return out as DataPricing;
}

// ---- Persistence (with a small in-process cache) ----
let _cache: { data: DataPricing; at: number } | null = null;
const TTL = 30_000;

export async function getDataPricing(): Promise<DataPricing> {
  if (_cache && Date.now() - _cache.at < TTL) return _cache.data;
  try {
    const c = await getConfig();
    const doc = await c.findOne({ key: "dataPricing" });
    const data = doc?.value ? sanitize(doc.value) : defaultPricing();
    _cache = { data, at: Date.now() };
    return data;
  } catch {
    return defaultPricing();
  }
}

export async function saveDataPricing(input: any): Promise<DataPricing> {
  const clean = sanitize(input);
  const c = await getConfig();
  await c.updateOne({ key: "dataPricing" }, { $set: { key: "dataPricing", value: clean, updatedAt: Date.now() } }, { upsert: true });
  _cache = { data: clean, at: Date.now() };
  return clean;
}
