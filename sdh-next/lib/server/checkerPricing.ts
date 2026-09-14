// Authoritative result-checker pricing. SERVER ONLY.
//
// Backend-persisted and admin-managed (Pricing → Results Checker), the same way data bundles
// work — the buy route must never trust a price from the client, and an admin editing the
// price has to actually change what gets charged.
//
// Terms, matching the rest of the app:
//   supplier — what DataHub charges us per voucher
//   cost     — what an AGENT pays us (their wholesale)
//   retail   — what a CUSTOMER pays
//   platform margin = cost − supplier      agent margin = retail − cost
//
// Only WASSCE and BECE are fulfillable: DataHub's voucher API supplies those two and nothing
// else, so priceChecker refuses anything toVoucherType() doesn't recognise, whatever is configured.
import { getConfig } from "./db";
import { toVoucherType } from "./providers/datahub";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CheckerPrice {
  id: string;
  name: string;
  body: string;
  supplier: number;  // Muviin's price to us — shown so an admin can see the real margin
  cost: number;      // agent price
  retail: number;    // customer price
}

// Seeded from DataHub's per-voucher price (WASSCE and BECE both GH₵17.00) with a margin for
// each side. An admin can change all of it on the Pricing page; this only applies until they
// first publish.
export function defaultCheckerPricing(): CheckerPrice[] {
  return [
    { id: "wassce", name: "WASSCE Checker", body: "WAEC", supplier: 17, cost: 19, retail: 21 },
    { id: "bece", name: "BECE Checker", body: "WAEC", supplier: 17, cost: 19, retail: 21 },
  ];
}

function sanitize(input: any): CheckerPrice[] {
  const arr = Array.isArray(input) ? input : defaultCheckerPricing();
  const out = arr
    .map((p: any) => ({
      id: String(p?.id || "").trim(),
      name: String(p?.name || "Checker"),
      body: String(p?.body || "WAEC"),
      supplier: Math.max(0, round2(Number(p?.supplier) || 0)),
      cost: Math.max(0, round2(Number(p?.cost) || 0)),
      retail: Math.max(0, round2(Number(p?.retail) || 0)),
    }))
    .filter((p) => p.id && !!toVoucherType(p.id));   // only what the provider can actually supply
  return out.length ? out : defaultCheckerPricing();
}

let cache: { at: number; value: CheckerPrice[] } | null = null;
const TTL = 30_000;

export async function getCheckerPricing(): Promise<CheckerPrice[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let value = defaultCheckerPricing();
  try {
    const c = await getConfig();
    const doc = await c.findOne({ key: "checkerPricing" });
    if (doc?.value) value = sanitize(doc.value);
  } catch {}
  cache = { at: Date.now(), value };
  return value;
}

export async function saveCheckerPricing(input: any): Promise<CheckerPrice[]> {
  const clean = sanitize(input);
  const c = await getConfig();
  await c.updateOne(
    { key: "checkerPricing" },
    { $set: { key: "checkerPricing", value: clean, updatedAt: Date.now() } },
    { upsert: true }
  );
  cache = { at: Date.now(), value: clean };
  return clean;
}

export interface PricedChecker {
  productId: string;
  name: string;
  qty: number;
  unitRetail: number;
  cost: number;        // total charged to this buyer's wallet
  commission: number;  // reseller margin, credited on delivery (0 for customers)
}

// Price a checker purchase, or null if the product isn't sold / can't be fulfilled.
export async function priceChecker(
  productId: string,
  qty: number,
  role: string
): Promise<PricedChecker | null> {
  if (!toVoucherType(productId)) return null;        // not supported by the provider
  const p = (await getCheckerPricing()).find((x) => x.id === productId);
  if (!p) return null;

  const q = Math.max(1, Math.min(20, Math.floor(qty || 1)));
  const isReseller = role === "reseller";
  const unit = isReseller ? p.cost : p.retail;       // agents pay their wholesale
  return {
    productId,
    name: p.name,
    qty: q,
    unitRetail: p.retail,
    cost: round2(unit * q),
    commission: isReseller ? round2(Math.max(0, p.retail - p.cost) * q) : 0,
  };
}
