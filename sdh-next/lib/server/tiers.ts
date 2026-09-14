// Reseller tiers, the tier bonus, and blended monthly earnings. SERVER ONLY.
//
// Implements "Tier Bonus Formula, Updated" (31 Jul 2026), which REPLACES the formula in the
// earlier "Reseller Incentive Logic" document. §1.3 thresholds and §2 blending still stand.
//
// THE ONE RULE, USED EVERYWHERE (§1): the tier bonus is a percentage of the PLATFORM'S OWN
// margin — what the agent pays us, minus what we pay the provider. It never depends on what the
// agent charges their customer, on the online store or on a manual buy.
//
//   platform_margin    = wholesale_price − supplier_price
//   tier_bonus_payout  = platform_margin × tier_percentage
//
// where wholesale_price is what the AGENT pays the PLATFORM, and supplier_price is what the
// PLATFORM pays its supplier.
//
// DO NOT compute this from the agent's retail price or from what the customer paid. That
// money is entirely the agent's and the platform has no part in it — basing a payout on it
// pays out money we never earned. The previous implementation did exactly that (it used
// `retail − wholesale`, the AGENT's margin), which is what this correction fixes.
//
// Worked example from §2, which tierBonus() reproduces exactly:
//   MTN 10GB · supplier GH₵38.50 · wholesale GH₵42.00 · platform margin GH₵3.50
//   at 8% → GH₵0.28.
import { getWallets } from "./db";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Tier {
  id: string;
  name: string;
  rate: number;   // bonus as a fraction OF MARGIN (never of retail)
  min: number;    // monthly blended earnings needed to sit on this tier
}

// §1.3 thresholds, on blended monthly earnings (see blendedTier below).
// Ids are kept stable (starter/silver/gold/pro) because they're already written into
// delivered orders as `tierBonusTier` and into ledger notes — renaming them would orphan
// that history. Only the display names changed.
export const TIERS: Tier[] = [
  { id: "starter", name: "Hustler",  rate: 0,    min: 0 },
  { id: "silver",  name: "Grinder",  rate: 0.05, min: 800 },
  { id: "gold",    name: "Boss",     rate: 0.08, min: 2500 },
  { id: "pro",     name: "Chairman", rate: 0.13, min: 6000 },
];

// The tier a monthly score sits on, plus the next one up (null at the top).
export function tierFor(score: number): { tier: Tier; next: Tier | null } {
  const s = Number(score) || 0;
  let i = 0;
  for (let k = 0; k < TIERS.length; k++) if (s >= TIERS[k].min) i = k;
  return { tier: TIERS[i], next: TIERS[i + 1] || null };
}

// §1: the payout on a margin that has already been worked out.
export function tierBonusOnMargin(margin: number, rate: number): number {
  const m = round2(Number(margin) || 0);
  if (!(m > 0)) return 0;                            // no margin, nothing to share
  const bonus = round2(m * (Number(rate) || 0));
  // Belt and braces: a bonus can never exceed the margin it comes out of, whatever rate
  // someone configures. platform_keeps must stay >= 0.
  return Math.max(0, Math.min(bonus, m));
}

// §1.1: the payout for one order, from the only two prices that matter.
//   wholesale — what the AGENT pays the PLATFORM
//   supplier  — what the PLATFORM pays the provider
// The agent's retail price is deliberately not a parameter: it can't influence this number,
// so it can't be passed in by mistake.
export function tierBonus(wholesale: number, supplier: number, rate: number): number {
  return tierBonusOnMargin(platformMargin(wholesale, supplier), rate);
}

// The platform's own margin on an order. Returns 0 when the supplier price is unknown (0),
// so an uncosted order pays no bonus rather than one computed off a guess.
export function platformMargin(wholesale: number, supplier: number): number {
  const w = round2(Number(wholesale) || 0);
  const s = round2(Number(supplier) || 0);
  if (!(w > 0) || !(s > 0)) return 0;
  return round2(w - s);
}

// ---- §2 Blended monthly earnings ----
//
// Tier progress combines store profit, commission and referral earnings — but §2's safeguard
// says at least 70% of the blended total must come from REAL SALES (store profit +
// commission). Otherwise someone could tier up purely by inviting people while selling
// nothing.
//
// So referral earnings are counted only up to the point where real sales are still 70% of
// the total: real / total >= 0.7  ⇒  total <= real / 0.7.
export const REAL_SALES_FLOOR = 0.7;

export interface Blended {
  storeProfit: number;
  commission: number;
  referrals: number;          // referral earnings actually made this month
  referralsCounted: number;   // how much of that counts toward the tier
  referralsExcluded: number;  // held back by the 70% safeguard
  realSales: number;          // storeProfit + commission
  total: number;              // the tier score
  earned: number;             // everything actually earned (what they were really paid)
}

export function blendedEarnings(storeProfit: number, commission: number, referrals: number): Blended {
  const sp = round2(Math.max(0, Number(storeProfit) || 0));
  const co = round2(Math.max(0, Number(commission) || 0));
  const rf = round2(Math.max(0, Number(referrals) || 0));

  const realSales = round2(sp + co);
  // With no real sales at all, referrals can't carry any tier progress.
  // Round the ceiling DOWN: rounding it up leaves real sales a hair under 70% of the total
  // (100 / 0.7 → 142.86 gives 69.9993%), which is the very thing the safeguard forbids.
  const cap = realSales > 0 ? Math.floor((realSales / REAL_SALES_FLOOR) * 100) / 100 : 0;
  const total = round2(Math.min(realSales + rf, cap));
  const referralsCounted = round2(Math.max(0, total - realSales));

  return {
    storeProfit: sp,
    commission: co,
    referrals: rf,
    referralsCounted,
    referralsExcluded: round2(rf - referralsCounted),
    realSales,
    total,
    earned: round2(realSales + rf),
  };
}

// ---- reading a reseller's month off the wallet ledger ----

const MONTH_START = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

// This calendar month's earnings for one user, split the way §2 wants them, and the tier
// that follows. Store profit and commission both arrive as "commission" ledger entries; a
// storefront sale is tagged in its note, which is what separates the two.
export async function monthlyBlended(userId: string): Promise<Blended & { tier: Tier; next: Tier | null }> {
  const since = MONTH_START();
  let storeProfit = 0, commission = 0, referrals = 0;
  try {
    const w = await getWallets();
    const doc = await w.findOne({ userId });
    for (const e of doc?.ledger || []) {
      if (!e || (e.at || 0) < since || (e.amount || 0) <= 0) continue;
      if (e.type === "commission") {
        if (String(e.note || "").startsWith("Store sale")) storeProfit += e.amount;
        else commission += e.amount;
      } else if (e.type === "referral" || e.type === "override") {
        referrals += e.amount;
      }
    }
  } catch {}
  const b = blendedEarnings(storeProfit, commission, referrals);
  return { ...b, ...tierFor(b.total) };
}
