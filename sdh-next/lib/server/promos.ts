// Storefront discount codes. SERVER ONLY.
//
// An agent creates codes in their dashboard; they live on the store config (so they sync to
// the backend with everything else and reach the public storefront). The guest checkout
// shows a discounted total, so the SERVER has to agree — otherwise we'd charge a price the
// customer never saw. Everything here is re-validated from the stored config; the client's
// code/discount is never trusted.
//
// The discount comes out of the AGENT's margin, not ours: we still take the platform
// wholesale, so a code can never discount past that (see capDiscount).
import { getStores } from "./db";

export interface PromoDoc {
  code: string;
  type: "percent" | "fixed";
  value: number;
  scope: string;      // "all" | a network id (mtn | telecel | atigo)
  uses: number;
  max: number;        // 0 = unlimited
  active: boolean;
  expires?: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Find a usable code on this store for this network, or null. Mirrors the storefront's
// client-side check so an applied code doesn't vanish at the till.
export function findPromo(config: any, rawCode: string, net: string): PromoDoc | null {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return null;
  const list: PromoDoc[] = Array.isArray(config?.promos) ? config.promos : [];
  const p = list.find(
    (x) =>
      x &&
      x.active &&
      String(x.code || "").toUpperCase() === code &&
      (!x.max || x.uses < x.max) &&
      (x.scope === "all" || x.scope === net)
  );
  return p || null;
}

// What the code takes off a given total.
export function discountFor(promo: PromoDoc, total: number): number {
  if (!promo) return 0;
  const raw = promo.type === "percent" ? (total * Number(promo.value)) / 100 : Math.min(Number(promo.value), total);
  return Math.max(0, round2(raw));
}

// A discount is the agent's to give, so it may eat their commission but never our wholesale:
// the platform still has to pay the provider. Caps the discount at (sell − wholesale).
export function capDiscount(discount: number, sell: number, wholesale: number): number {
  return Math.max(0, Math.min(round2(discount), round2(Math.max(0, sell - wholesale))));
}

// Count a redemption once the order is actually paid for and placed. Best-effort and
// positional: the config is an opaque blob, so we rewrite the one entry by index.
export async function recordPromoUse(handle: string, code: string): Promise<void> {
  if (!code) return;
  try {
    const stores = await getStores();
    const doc = await stores.findOne({ handle });
    const list: PromoDoc[] = Array.isArray(doc?.config?.promos) ? doc.config.promos : [];
    const i = list.findIndex((x) => String(x?.code || "").toUpperCase() === String(code).toUpperCase());
    if (i < 0) return;
    const next = list.map((x, n) => (n === i ? { ...x, uses: Number(x.uses || 0) + 1 } : x));
    await stores.updateOne({ handle }, { $set: { "config.promos": next, updatedAt: Date.now() } });
  } catch (e) {
    console.error(`Could not record use of promo ${code} on ${handle}:`, e);
  }
}
