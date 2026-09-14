// Reseller recruitment override. SERVER ONLY.
//
// Implements "SDH Incentive Logic" (30 Jul 2026) §4. A reseller who recruits ANOTHER
// RESELLER (not a customer) earns a small override on what that recruit goes on to earn.
//
//   trigger    an existing reseller's invitee signs up, is approved as a reseller, and
//              earns commission
//   reward     2% of the RECRUIT'S COMMISSION EARNINGS — never their sales value
//   duration   the recruit's first 60 days, or until their cumulative commission reaches
//              GH₵500, whichever comes first
//   depth      one level only; a recruiter earns nothing on their recruit's own recruits
//   cap        GH₵50 of override per recruiter per calendar month
//
//   override_payout = recruit_commission_earned × 2%
//   NEVER             recruit_sales_value × 2%
//
// Deliberately single-level: no chains, no pyramid.
import { getReferrals, getUsers, getWallets, queryReferrals, usingMongo } from "./db";
import { ghs, notifyUser } from "./notifications";
import { addTx } from "./wallet";

export const OVERRIDE_RATE = 0.02;
export const OVERRIDE_WINDOW_DAYS = 60;
export const OVERRIDE_COMMISSION_CEILING = 500;  // recruit's cumulative commission
export const OVERRIDE_MONTHLY_CAP = 50;          // per recruiter, per month

const round2 = (n: number) => Math.round(n * 100) / 100;
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };

async function findUser(id: string): Promise<any> {
  const users = await getUsers();
  if (!usingMongo) return users.findOne({ _id: String(id) });
  try {
    const { ObjectId } = await import("mongodb");
    return await users.findOne({ _id: new ObjectId(String(id)) });
  } catch { return null; }
}

// Everything the recruit has earned in commission so far, and this month's override total
// for the recruiter — both read straight off the wallet ledgers.
async function ledgerTotals(userId: string): Promise<{ commissionLifetime: number; overrideThisMonth: number }> {
  const w = await getWallets();
  const doc = await w.findOne({ userId: String(userId) });
  const since = monthStart();
  let commissionLifetime = 0, overrideThisMonth = 0;
  for (const e of doc?.ledger || []) {
    if (!e || (e.amount || 0) <= 0) continue;
    if (e.type === "commission") commissionLifetime += e.amount;
    if (e.type === "override" && (e.at || 0) >= since) overrideThisMonth += e.amount;
  }
  return { commissionLifetime: round2(commissionLifetime), overrideThisMonth: round2(overrideThisMonth) };
}

// Call this whenever a RESELLER is credited commission. Pays their recruiter (if any) the
// §4 override. Best-effort: never fails or blocks the commission that triggered it.
export async function payRecruitmentOverride(
  recruitUserId: string,
  commissionAmount: number,
  ref: string
): Promise<void> {
  try {
    const earned = round2(Number(commissionAmount) || 0);
    if (!(earned > 0)) return;

    // Who recruited them? One level only — we look up the recruit's own referral row and
    // never walk further up the chain.
    const referrals = await getReferrals();
    const link = await referrals.findOne({ referredId: String(recruitUserId) });
    if (!link || !link.referrerId) return;

    // §4 applies to recruited RESELLERS only, and the recruiter must be a reseller too.
    const [recruit, recruiter] = await Promise.all([findUser(recruitUserId), findUser(link.referrerId)]);
    if (!recruit || !recruiter) return;
    if (recruit.role !== "reseller" || recruit.agentStatus !== "approved") return;
    if (recruiter.role !== "reseller") return;

    // Duration: 60 days from the recruit joining, OR until their cumulative commission
    // passes GH₵500 — whichever lands first. `earned` is already in that lifetime figure,
    // so we measure from before this payment to keep the boundary order-independent.
    const joinedAt = Number(link.at || recruit.createdAt || 0);
    if (joinedAt && Date.now() - joinedAt > OVERRIDE_WINDOW_DAYS * 86400e3) return;

    const { commissionLifetime } = await ledgerTotals(recruitUserId);
    const before = round2(commissionLifetime - earned);
    if (before >= OVERRIDE_COMMISSION_CEILING) return;

    // Only the slice of this commission that falls under the ceiling earns an override.
    const eligible = round2(Math.min(earned, OVERRIDE_COMMISSION_CEILING - before));
    if (!(eligible > 0)) return;

    // §4 base: the recruit's COMMISSION, never their sales value.
    let payout = round2(eligible * OVERRIDE_RATE);
    if (!(payout > 0)) return;

    // Cap the recruiter at GH₵50 of override per month.
    const { overrideThisMonth } = await ledgerTotals(link.referrerId);
    const room = round2(OVERRIDE_MONTHLY_CAP - overrideThisMonth);
    if (room <= 0) return;
    payout = round2(Math.min(payout, room));
    if (!(payout > 0)) return;

    await addTx(String(link.referrerId), {
      type: "override",
      amount: payout,
      ref,
      note: `Recruitment override · ${link.referredName || "your recruit"}`,
    });
    await notifyUser(String(link.referrerId), {
      type: "referral",
      title: `Override earned · ${ghs(payout)}`,
      body: `${link.referredName || "Your recruit"} earned commission, so you've earned ${ghs(payout)} as their recruiter.`,
      icon: "coins",
      link: "wallet",
      ref,
    });
  } catch (e: any) {
    console.error("Recruitment override error:", e?.message);
  }
}

// One recruiter's override summary, for the agent dashboard.
export async function overrideStats(userId: string): Promise<{
  rate: number; monthlyCap: number; earnedThisMonth: number; remainingThisMonth: number; recruits: any[];
}> {
  const rows = (await queryReferrals({ referrerId: String(userId) })) as any[];
  const { overrideThisMonth } = await ledgerTotals(userId);

  const recruits: any[] = [];
  for (const r of rows.slice(0, 25)) {
    const u = await findUser(r.referredId);
    if (!u || u.role !== "reseller") continue;   // customers belong to §3, not §4
    const { commissionLifetime } = await ledgerTotals(r.referredId);
    const joinedAt = Number(r.at || 0);
    const daysLeft = joinedAt ? Math.max(0, Math.ceil((joinedAt + OVERRIDE_WINDOW_DAYS * 86400e3 - Date.now()) / 86400e3)) : 0;
    recruits.push({
      id: r.id,
      name: r.referredName,
      approved: u.agentStatus === "approved",
      commission: commissionLifetime,
      ceiling: OVERRIDE_COMMISSION_CEILING,
      daysLeft,
      active: daysLeft > 0 && commissionLifetime < OVERRIDE_COMMISSION_CEILING && u.agentStatus === "approved",
    });
  }

  return {
    rate: OVERRIDE_RATE,
    monthlyCap: OVERRIDE_MONTHLY_CAP,
    earnedThisMonth: overrideThisMonth,
    remainingThisMonth: round2(Math.max(0, OVERRIDE_MONTHLY_CAP - overrideThisMonth)),
    recruits,
  };
}
