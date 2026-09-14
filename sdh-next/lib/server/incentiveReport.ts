// Admin reporting for the incentive programme. SERVER ONLY.
//
// One place for everything the "SDH Incentive Logic" spec pays out, so an admin can see what
// the platform is actually spending on incentives and who is earning it:
//   §1  tier bonuses (a share of each order's MARGIN)
//   §2  each agent's blended monthly earnings and where they sit against the 70% safeguard
//   §3  referral credit issued
//   §4  recruitment overrides
//
// Everything is read from the wallet ledgers, which are the record of what was really paid —
// not recomputed from prices, so this can't disagree with the money that actually moved.
import { queryUsers, queryWallets } from "./db";
import { TIERS, blendedEarnings, tierFor, REAL_SALES_FLOOR } from "./tiers";
import { OVERRIDE_MONTHLY_CAP, OVERRIDE_RATE } from "./overrides";
import { CREDIT_EXPIRY_DAYS, MONTHLY_PAID_CAP, REFERRED_REWARD, REFERRER_REWARD } from "./referrals";

const r2 = (n: number) => Math.round(n * 100) / 100;
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };

export interface IncentiveAgentRow {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  role: string;
  // §2 blended monthly earnings
  storeProfit: number;
  commission: number;
  referrals: number;          // referral + override earnings this month
  referralsCounted: number;   // what the 70% safeguard lets count
  referralsExcluded: number;
  tierScore: number;          // the blended total tiers are read from
  earnedThisMonth: number;    // what they were actually paid
  tier: string;
  tierRate: number;
  nextTier: string | null;
  toNextTier: number;
  // lifetime
  lifetimeEarned: number;
  creditBalance: number;      // unspent, unexpired referral credit
}

export interface IncentiveReport {
  rules: {
    tiers: typeof TIERS;
    realSalesFloor: number;
    referrerReward: number;
    referredReward: number;
    creditExpiryDays: number;
    referralMonthlyCap: number;
    overrideRate: number;
    overrideMonthlyCap: number;
  };
  totals: {
    tierBonusMonth: number;
    tierBonusLifetime: number;
    storeProfitMonth: number;
    referralCreditMonth: number;
    referralCreditLifetime: number;
    overrideMonth: number;
    overrideLifetime: number;
    outstandingCredit: number;    // issued, unspent, not yet expired — a real liability
    incentiveSpendMonth: number;  // tier bonus + referral credit + override, this month
  };
  tierCounts: { id: string; name: string; rate: number; min: number; agents: number }[];
  agents: IncentiveAgentRow[];
}

// A tier-bonus credit is tagged in its note by tierPayouts.ts ("<Tier> tier bonus · …"), and a
// storefront sale by storeOrders.ts ("Store sale · …"). That's what separates the buckets.
const isTierBonus = (note: string) => / tier bonus · /.test(String(note || ""));
const isStoreSale = (note: string) => String(note || "").startsWith("Store sale");

export async function incentiveReport(): Promise<IncentiveReport> {
  const [users, wallets] = await Promise.all([queryUsers({}), queryWallets({})]);
  const since = monthStart();

  const walletBy = new Map<string, any>();
  for (const w of wallets as any[]) walletBy.set(String(w.userId), w);

  const totals = {
    tierBonusMonth: 0, tierBonusLifetime: 0, storeProfitMonth: 0,
    referralCreditMonth: 0, referralCreditLifetime: 0,
    overrideMonth: 0, overrideLifetime: 0,
    outstandingCredit: 0, incentiveSpendMonth: 0,
  };
  const agents: IncentiveAgentRow[] = [];
  const now = Date.now();

  for (const u of users as any[]) {
    const id = String(u._id);
    const w = walletBy.get(id);
    const ledger = w?.ledger || [];

    let storeProfit = 0, commission = 0, referrals = 0, lifetimeEarned = 0;
    for (const e of ledger) {
      if (!e || (e.amount || 0) <= 0) continue;
      const inMonth = (e.at || 0) >= since;
      if (e.type === "commission") {
        lifetimeEarned += e.amount;
        if (isTierBonus(e.note)) {
          totals.tierBonusLifetime += e.amount;
          if (inMonth) totals.tierBonusMonth += e.amount;
        }
        if (inMonth) {
          if (isStoreSale(e.note)) { storeProfit += e.amount; totals.storeProfitMonth += e.amount; }
          else commission += e.amount;
        }
      } else if (e.type === "referral") {
        lifetimeEarned += e.amount;
        totals.referralCreditLifetime += e.amount;
        if (inMonth) { referrals += e.amount; totals.referralCreditMonth += e.amount; }
      } else if (e.type === "override") {
        lifetimeEarned += e.amount;
        totals.overrideLifetime += e.amount;
        if (inMonth) { referrals += e.amount; totals.overrideMonth += e.amount; }
      }
    }

    // Unspent, unexpired credit is money we still owe in goods.
    const credit = r2((w?.credits || [])
      .filter((g: any) => g && g.remaining > 0 && g.expiresAt > now)
      .reduce((s: number, g: any) => s + g.remaining, 0));
    totals.outstandingCredit += credit;

    // Only resellers hold a tier, but a customer can still be sitting on referral credit —
    // so they're skipped from the agent table while still counting in the totals above.
    if (u.role !== "reseller") continue;

    const b = blendedEarnings(storeProfit, commission, referrals);
    const { tier, next } = tierFor(b.total);
    agents.push({
      id,
      name: String(u.name || u.business || "Agent"),
      business: u.business || null,
      phone: u.phone?.local || null,
      role: u.role,
      storeProfit: b.storeProfit,
      commission: b.commission,
      referrals: b.referrals,
      referralsCounted: b.referralsCounted,
      referralsExcluded: b.referralsExcluded,
      tierScore: b.total,
      earnedThisMonth: b.earned,
      tier: tier.name,
      tierRate: tier.rate,
      nextTier: next ? next.name : null,
      toNextTier: next ? r2(Math.max(0, next.min - b.total)) : 0,
      lifetimeEarned: r2(lifetimeEarned),
      creditBalance: credit,
    });
  }

  for (const k of Object.keys(totals) as (keyof typeof totals)[]) totals[k] = r2(totals[k]);
  totals.incentiveSpendMonth = r2(totals.tierBonusMonth + totals.referralCreditMonth + totals.overrideMonth);

  const tierCounts = TIERS.map((t) => ({
    id: t.id, name: t.name, rate: t.rate, min: t.min,
    agents: agents.filter((a) => a.tier === t.name).length,
  }));

  agents.sort((a, b) => b.tierScore - a.tierScore || b.earnedThisMonth - a.earnedThisMonth);

  return {
    rules: {
      tiers: TIERS,
      realSalesFloor: REAL_SALES_FLOOR,
      referrerReward: REFERRER_REWARD,
      referredReward: REFERRED_REWARD,
      creditExpiryDays: CREDIT_EXPIRY_DAYS,
      referralMonthlyCap: MONTHLY_PAID_CAP,
      overrideRate: OVERRIDE_RATE,
      overrideMonthlyCap: OVERRIDE_MONTHLY_CAP,
    },
    totals,
    tierCounts,
    agents,
  };
}
