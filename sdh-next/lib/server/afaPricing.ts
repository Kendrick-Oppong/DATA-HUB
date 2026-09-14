// Authoritative AFA registration pricing. SERVER ONLY.
//
// AFA is priced by ADMIN ONLY and costs the same everywhere — in-app, and on every agent's
// storefront. Unlike data bundles there is no agent margin to set and no commission to earn:
// agents cannot mark it up, mark it down, or profit from it. Every route that charges for a
// registration reads the price from here, so an admin edit takes effect everywhere at once
// and a price sent by a client is always ignored.
//
// `supplier` is what the registration costs US. It exists only so an admin can see the real
// margin on the Pricing page — nothing charges it to anybody.
import { getConfig } from "./db";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface AfaPricing {
  price: number;      // what EVERY applicant pays, agent or customer or guest
  supplier: number;   // our cost — admin-visible only
  updatedAt?: number;
}

export const AFA_MIN_PRICE = 1;
export const AFA_MAX_PRICE = 500;

export function defaultAfaPricing(): AfaPricing {
  return { price: 20, supplier: 6 };
}

function sanitize(input: any): AfaPricing {
  const price = round2(Number(input?.price));
  const supplier = round2(Number(input?.supplier));
  const d = defaultAfaPricing();
  return {
    price: Number.isFinite(price) && price >= AFA_MIN_PRICE && price <= AFA_MAX_PRICE ? price : d.price,
    supplier: Number.isFinite(supplier) && supplier >= 0 ? supplier : d.supplier,
    updatedAt: Number(input?.updatedAt) || undefined,
  };
}

// Short in-process cache so a burst of registrations doesn't mean a DB read each time.
let cache: { at: number; value: AfaPricing } | null = null;
const TTL = 30_000;

export async function getAfaPricing(): Promise<AfaPricing> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let value = defaultAfaPricing();
  try {
    const config = await getConfig();
    const doc = await config.findOne({ key: "afaPricing" });
    if (doc?.value) value = sanitize(doc.value);
  } catch (e: any) {
    console.error("AFA pricing read failed, using defaults:", e?.message);
  }
  cache = { at: Date.now(), value };
  return value;
}

// Admin publish. Returns the stored result so the caller can echo back what actually took.
export async function saveAfaPricing(input: any): Promise<AfaPricing> {
  const value = { ...sanitize(input), updatedAt: Date.now() };
  const config = await getConfig();
  await config.updateOne({ key: "afaPricing" }, { $set: { key: "afaPricing", value } }, { upsert: true });
  cache = { at: Date.now(), value };
  return value;
}

// The platform fee — what an agent pays US for a registration, and what a customer pays
// in-app. Admin-set; no role argument, because there is no separate agent rate.
export async function priceAfa(): Promise<{ price: number; supplier: number }> {
  const { price, supplier } = await getAfaPricing();
  return { price, supplier };
}

// What a registration costs on a specific agent's STOREFRONT.
//
// The agent sets their own selling price and keeps the difference as their own profit —
// exactly like a data bundle. Two rules make that safe:
//   * it can never be BELOW the platform fee, or the agent would be selling at a loss to us
//   * no price set (or an invalid one) simply falls back to the fee, so a store that has
//     never been priced still sells at cost rather than refusing the sale
//
// AFA earns the agent NOTHING beyond this margin: no tier bonus and no recruitment override
// are paid on it (see afa.ts creditAgentProfit).
export async function priceAfaForStore(config: any): Promise<{ fee: number; sell: number; profit: number }> {
  const { price: fee } = await getAfaPricing();
  const wanted = round2(Number(config?.afaPrice));
  const sell = Number.isFinite(wanted) && wanted >= fee ? wanted : fee;
  return { fee, sell, profit: round2(sell - fee) };
}
