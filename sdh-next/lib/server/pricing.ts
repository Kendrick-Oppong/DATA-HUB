// Authoritative data-bundle pricing. SERVER ONLY.
// The buy flow must NOT trust the price/cost sent by the client — a tampered request could
// otherwise buy a real bundle for pennies. Prices are read from the admin-managed pricing
// store (pricingStore.ts), so whatever an admin publishes on the Pricing page is what
// actually gets charged everywhere.
import { getDataPricing, pricingKeyOf, type PricingKey } from "./pricingStore";
import { LINE_NAME, type ProductLine } from "./providers/lines";

const round2 = (n: number) => Math.round(n * 100) / 100;

// The store-config key an agent's own prices for a line are saved under. These are short
// legacy keys written into every existing store doc, so they can't be derived from the
// pricing key — "atbig" and "mtnx" are the two lines that differ from the plain network id.
export function storePriceKeyOf(net: string, line?: ProductLine | null): string {
  if (net === "atigo" && line === "bigtime") return "atbig";
  if (net === "mtn" && line === "xpress") return "mtnx";
  return net;
}

// Every (store price key → published pricing line) pair, derived from the two functions
// above so the mapping can't drift out of step with either of them.
export const STORE_PRICE_LINES: Array<{ storeKey: string; lineKey: PricingKey }> =
  ([["mtn", null], ["mtn", "xpress"], ["telecel", null], ["atigo", "ishare"], ["atigo", "bigtime"]] as Array<[string, ProductLine | null]>)
    .map(([net, line]) => ({ storeKey: storePriceKeyOf(net, line), lineKey: pricingKeyOf(net, line) as PricingKey }));

export interface PricedBundle {
  id: string;        // the published bundle's id — agents' store prices may be keyed by it
  gb: number;
  days: number;      // 0 => never expires (AT BigTime / any non-expiry bundle)
  price: number;     // retail (what a customer pays)
  reseller: number;  // wholesale (what a reseller is charged)
  cost: number;      // amount to debit this buyer's wallet
  commission: number;// reseller margin, credited on delivery (0 for customers)
  supplier: number;  // what the PLATFORM pays the provider for this bundle (our true cost)
  pkg: string;       // display label, e.g. "5GB · 30 days" / "10GB BigTime · No expiry"
}

// Display label. Only lines that are NOT the network's default get named — "5GB · 30 days"
// for plain MTN, "5GB Xpress · 30 days" for MTN Xpress, and AT always names its line because
// iShare and BigTime are equally prominent products.
function labelFor(net: string, line: ProductLine | undefined, gb: number, days: number, noExpiry: boolean): string {
  const named = net === "atigo" ? (line === "bigtime" ? "bigtime" : "ishare")
    : net === "mtn" && line === "xpress" ? "xpress"
    : null;
  const base = named ? `${gb}GB ${LINE_NAME[named]}` : `${gb}GB`;
  return `${base} · ${noExpiry || !days ? "No expiry" : days + " days"}`;
}

// Resolve the authoritative price for a bundle from the published pricing, or null if the
// request is invalid (unknown network or a capacity that isn't a published bundle size).
export async function priceBundle(
  net: string,
  atProduct: ProductLine | undefined,
  capacityGb: number,
  role: string
): Promise<PricedBundle | null> {
  const key = pricingKeyOf(net, atProduct);
  if (!key) return null;
  const pricing = await getDataPricing();
  const b = pricing[key].find((x) => x.gb === capacityGb);
  if (!b) return null;

  const retail = b.retail;
  const wholesale = b.wholesale;
  const isReseller = role === "reseller";
  const cost = isReseller ? wholesale : retail;
  const commission = isReseller ? Math.max(0, round2(retail - wholesale)) : 0;

  return {
    id: String(b.id || ""),
    gb: b.gb,
    days: b.days,
    price: retail,
    reseller: wholesale,
    cost,
    commission,
    supplier: supplierPriceFor(pricing, key, b.gb, b.noExpiry),
    pkg: labelFor(net, atProduct, b.gb, b.days, b.noExpiry),
  };
}

// Guard against charging an amount the buyer was never shown.
//
// Every buy route prices server-side and ignores the client's figure, which stops underpaying
// — but it does nothing about the opposite failure, where the screen quoted one price and the
// charge is another (a stale tab, prices republished mid-checkout, or a client/session role
// disagreement). The client sends back the amount it displayed as `expectedCost`; if it
// doesn't match, the purchase is refused rather than silently charged.
//
// Returns null when they agree (or nothing was sent — older clients still work), otherwise
// the message to show. Tolerance is half a pesewa, for float noise only.
//
// The wording reaches SHOPPERS on an agent's public storefront, so it says what the price is
// now and what to do — it never quotes our internal comparison back at them or asks them to
// refresh the page. The corrected figure is returned alongside it as `cost` so a checkout can
// update its total and carry on instead of dead-ending.
export function priceMismatch(expected: any, actual: number): string | null {
  const shown = Number(expected);
  if (!Number.isFinite(shown) || shown <= 0) return null;   // not sent — nothing to check
  if (Math.abs(shown - actual) < 0.005) return null;
  return `This bundle is now GH₵${actual.toFixed(2)}. Please review the updated price and try again.`;
}

// What the provider charges US for a bundle, from the admin-maintained vendor catalog.
//
// This is the figure the TIER BONUS is computed against — platform margin is
// `wholesale − supplier`, never anything involving the agent's retail price (see tiers.ts).
// Returns 0 when the catalog has no matching row, and callers treat 0 as "unknown" and skip
// the bonus rather than guess: paying a bonus off an unknown cost is how a sale becomes a loss.
export function supplierPriceFor(pricing: any, key: string, gb: number, noExpiry: boolean): number {
  const rows = pricing?.vendor?.[key];
  if (!Array.isArray(rows)) return 0;
  const hit = rows.find((v: any) => Number(v?.gb) === Number(gb) && !!v?.noExpiry === !!noExpiry)
    || rows.find((v: any) => Number(v?.gb) === Number(gb));
  const price = round2(Number(hit?.price) || 0);
  return price > 0 ? price : 0;
}

// ---- Storefront (guest) data pricing ----
// A guest buying on an agent's public storefront pays the AGENT's own price (config.prices),
// not the platform retail. The platform still charges the agent the published wholesale to
// fulfil, so the agent's commission is sell − wholesale. Priced server-side from the stored
// config + the published wholesale (never from the client).
export interface StorePricedData {
  gb: number;
  sell: number;       // what the guest pays (agent's set price)
  wholesale: number;  // platform provider cost (published wholesale)
  commission: number; // agent margin credited on delivery (sell − wholesale, never < 0)
  supplier: number;   // what the platform pays the provider — the tier-bonus base, with wholesale
  pkg: string;        // display label
}
// The price an agent has saved for one bundle, or null if they haven't set one.
//
// THIS MUST STAY IDENTICAL TO agentQuote()'s "data" case in lib/data.ts. The storefront
// renders the price from that copy and the checkout charges from this one — if the two
// resolve different keys, a customer is shown one figure and billed another.
//
// Two key generations exist in the wild, so both are tried in a fixed order:
//   1. the PUBLISHED bundle's id ("d1-1787432805465") — what My Store writes today
//      (setStorePrice in components/store.tsx keys on the live bundle id)
//   2. the capacity-derived id ("d1") — older stores, and the only key the server used to read
// Each is tried nested-per-line first, then in the legacy flat shape.
//
// Note the id in (1) is regenerated whenever an admin re-creates a bundle on the Pricing page,
// which orphans anything saved against the previous id — that is why (2) has to remain.
export function resolveStorePrice(
  config: any,
  priceKey: string,
  bundleId: string | undefined,
  capacityGb: number
): number | null {
  const prices = (config && config.prices) || {};
  const per = prices[priceKey];
  const keys = [bundleId, "d" + capacityGb].filter(Boolean) as string[];
  for (const k of keys) if (per && per[k] != null && !Number.isNaN(Number(per[k]))) return Number(per[k]);
  for (const k of keys) if (prices[k] != null && !Number.isNaN(Number(prices[k]))) return Number(prices[k]);
  return null;
}

// Every published bundle's ACTUAL storefront price, resolved and floored, for a guest.
//
// The storefront can't work this out for itself. A shopper is never sent the wholesale — that
// would hand them the agent's margin — so the page has no way to tell a below-cost price from
// a keen one, and would happily advertise the ₵2 that /quote and /pay now refuse to honour.
// Sending the finished figure is what keeps the shelf and the till in agreement.
//
// Each bundle is written under BOTH key generations (the published bundle id and the "d<gb>"
// capacity key) so whichever one the client looks up first it finds this number, and never
// falls through to a stale legacy entry. Anything else in `prices` is passed through as-is.
export async function storefrontPrices(config: any): Promise<any> {
  const out: any = { ...((config && config.prices) || {}) };
  let pricing: any;
  try {
    pricing = await getDataPricing();
  } catch {
    return out;   // pricing unavailable — send what's stored rather than an empty shop
  }
  for (const { storeKey, lineKey } of STORE_PRICE_LINES) {
    const rows = pricing[lineKey];
    if (!Array.isArray(rows) || !rows.length) continue;
    const per: any = { ...(out[storeKey] || {}) };
    for (const b of rows) {
      const saved = resolveStorePrice(config, storeKey, String(b.id || ""), b.gb);
      const sell = Math.max(round2(b.wholesale), round2(saved == null ? b.retail : saved));
      per["d" + b.gb] = sell;
      if (b.id) per[String(b.id)] = sell;
    }
    out[storeKey] = per;
  }
  return out;
}

export async function priceStoreData(
  config: any,
  net: string,
  atProduct: ProductLine | undefined,
  capacityGb: number
): Promise<StorePricedData | null> {
  const priced = await priceBundle(net, atProduct, capacityGb, "reseller");
  if (!priced) return null;

  const priceKey = storePriceKeyOf(net, atProduct);
  const sellRaw = resolveStorePrice(config, priceKey, priced.id, capacityGb);
  let sell: number = sellRaw == null ? priced.price : sellRaw;          // fall back to platform retail

  const wholesale = priced.reseller;
  // Floor the agent's price at WHOLESALE. An agent who typed 2 where they meant 12 was
  // charging the guest GH₵2 for a bundle the platform still bought from the provider for
  // GH₵7.60 — every one of those sales was a straight loss to us, and `commission`'s
  // max(0, …) hid it by quietly paying the agent nothing instead of flagging it. An agent's
  // price sets THEIR margin, never ours: priced below wholesale the storefront sells at
  // wholesale (zero agent profit) rather than below the platform's own cost.
  sell = Math.max(round2(wholesale), round2(sell));
  const commission = Math.max(0, round2(sell - wholesale));
  // `supplier` rides along so a store sale can pay the same tier bonus as a manual buy —
  // the bonus base is wholesale − supplier either way, never the agent's own `sell`.
  return { gb: priced.gb, sell, wholesale, commission, supplier: priced.supplier, pkg: priced.pkg };
}
