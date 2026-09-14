// Customer referral programme. SERVER ONLY.
//
// Implements "SDH Incentive Logic" (30 Jul 2026) §3. This replaced the old flat GH₵5/GH₵5,
// top-up-triggered scheme.
//
//   referrer      GH₵3 wallet credit
//   new customer  GH₵2 wallet credit (spent automatically on their next order)
//   TRIGGER       the referred person's first order reaching DELIVERED — never signup,
//                 never merely "placed", and never an order that fails or is refunded.
//                 §3 is emphatic about this: paying before delivery is confirmed is the
//                 usual way a referral programme leaks money on failed/fraudulent orders.
//   reward type   promotional credit — spendable on anything, NOT withdrawable or cashable
//   expiry        60 days from issue
//   cap           at most 10 PAID referrals per referrer per calendar month
//   anti-abuse    one reward per phone number, ever, on the new-customer side
//
// Money moves at most once per referral: qualifying claims `status: pending → qualified`
// with a guarded updateOne before either wallet is credited, so concurrent deliveries can't
// double-pay.
//
// Depends only on db.ts + wallet.ts + notifications.ts, so users.ts can import it cycle-free.
import { getReferrals, getUsers, queryReferrals, queryUsers, usingMongo } from "./db";
import { ghs, notifyUser } from "./notifications";
import { addCredit } from "./wallet";

// §3 reward table. The two sides are deliberately different amounts.
export const REFERRER_REWARD = Number(process.env.REFERRER_REWARD_GHS || 3);
export const REFERRED_REWARD = Number(process.env.REFERRED_REWARD_GHS || 2);
// Credit expiry, and the monthly ceiling on how many referrals one person can be paid for.
export const CREDIT_EXPIRY_DAYS = 60;
export const MONTHLY_PAID_CAP = 10;
// Kept as the headline figure the "invite a friend" UI quotes.
export const REFERRAL_REWARD = REFERRER_REWARD;

export type ReferralStatus = "pending" | "qualified";

export interface ReferralDoc {
  id: string;                // REF-…
  code: string;              // the referrer's code, as used at signup
  referrerId: string;
  referrerName: string;
  referredId: string;        // one referral per referred account (unique)
  referredName: string;
  referredPhone: string | null;
  status: ReferralStatus;
  reward: number;             // GHS credited to the REFERRER on qualifying
  referredReward: number;     // GHS credited to the new customer
  at: number;                 // signed up
  qualifiedAt?: number;       // their first order was delivered
  blockedReason?: string;     // recorded when a qualifying referral is intentionally unpaid
}

export function newReferralRef(): string {
  return "REF-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// ---- codes ----

// Build a candidate code from a name: first word's letters + 4 digits (e.g. FRED1899).
function candidate(name: string): string {
  const first = String(name || "").trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return (first || "SDH") + digits;
}

export function normalizeCode(code: string): string {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function findUserByRefCode(code: string): Promise<any> {
  const c = normalizeCode(code);
  if (!c) return null;
  return (await getUsers()).findOne({ refCode: c });
}

// A unique referral code for a new account. Retries on collision, then falls back to a
// timestamp-based code that can't realistically clash.
export async function generateRefCode(name: string): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const c = candidate(name);
    if (!(await findUserByRefCode(c))) return c;
  }
  return "SDH" + Date.now().toString(36).toUpperCase().slice(-6);
}

// Backfill a code for an account created before referrals existed (or if one went missing),
// so every agent always has a shareable code.
export async function ensureRefCode(user: any): Promise<string> {
  if (user?.refCode) return user.refCode;
  const code = await generateRefCode(user?.name || user?.business || "");
  const users = await getUsers();
  const q = usingMongo
    ? { _id: new (await import("mongodb")).ObjectId(String(user._id)) }
    : { _id: String(user._id) };
  await users.updateOne(q, { $set: { refCode: code } });
  return code;
}

// ---- recording a referred signup ----

// Called at signup when a referral code was entered. Best-effort: an invalid or self-
// referring code simply records nothing — it never blocks account creation.
export async function recordReferral(newUser: any, code: string): Promise<ReferralDoc | null> {
  try {
    const c = normalizeCode(code);
    if (!c) return null;
    const referrer = await findUserByRefCode(c);
    if (!referrer) return null;
    if (String(referrer._id) === String(newUser._id)) return null;   // no self-referral

    const referrals = await getReferrals();
    if (await referrals.findOne({ referredId: String(newUser._id) })) return null;  // already referred

    // §3 anti-abuse: a phone number can only ever be the NEW CUSTOMER side of a referral
    // once. Checked here so a repeat number is never even recorded as pending.
    const phone = newUser.phone?.local || null;
    if (phone && (await referrals.findOne({ referredPhone: phone }))) return null;

    const doc: ReferralDoc = {
      id: newReferralRef(),
      code: c,
      referrerId: String(referrer._id),
      referrerName: String(referrer.business || referrer.name || "Agent"),
      referredId: String(newUser._id),
      referredName: String(newUser.name || "New user"),
      referredPhone: phone,
      status: "pending",
      reward: REFERRER_REWARD,
      referredReward: REFERRED_REWARD,
      at: Date.now(),
    };
    await referrals.insertOne(doc);

    await notifyUser(doc.referrerId, {
      type: "referral",
      title: "Someone joined with your code",
      body: `${doc.referredName} signed up using ${c}. You'll get ${ghs(REFERRER_REWARD)} in credit once their first order is delivered.`,
      icon: "gift",
      link: "dashboard",
      ref: doc.id,
    });
    return doc;
  } catch (e: any) {
    console.error("Referral record error:", e?.message);
    return null;
  }
}

// ---- qualifying (paid on the referred user's FIRST DELIVERED ORDER) ----

const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };

// How many referrals this referrer has already been PAID for this calendar month (§3 cap).
async function paidThisMonth(referrerId: string): Promise<number> {
  const rows = (await queryReferrals({ referrerId: String(referrerId) })) as ReferralDoc[];
  const since = monthStart();
  return rows.filter((r) => r.status === "qualified" && !r.blockedReason && (r.qualifiedAt || 0) >= since).length;
}

// Called when an order belonging to `referredUserId` is confirmed DELIVERED. Credits both
// sides exactly once. Best-effort: a failure here never fails the delivery that triggered it.
export async function qualifyReferral(referredUserId: string): Promise<void> {
  try {
    const referrals = await getReferrals();
    const doc = (await referrals.findOne({ referredId: String(referredUserId) })) as ReferralDoc | null;
    if (!doc || doc.status === "qualified") return;

    // Claim it before any money moves, so concurrent deliveries can't double-credit.
    const claim = await referrals.updateOne(
      { id: doc.id, status: "pending" },
      { $set: { status: "qualified", qualifiedAt: Date.now() } }
    );
    if (!claim || (claim as any).matchedCount === 0) return;

    // §3 cap: at most 10 PAID referrals per referrer per month. The referral still settles
    // (so it can't be retried later for a payout), but no money moves and we say why.
    if ((await paidThisMonth(doc.referrerId)) >= MONTHLY_PAID_CAP) {
      await referrals.updateOne({ id: doc.id }, { $set: { blockedReason: "monthly cap reached" } });
      await notifyUser(doc.referrerId, {
        type: "referral",
        title: "Referral cap reached this month",
        body: `${doc.referredName}'s first order was delivered, but you've already had the maximum ${MONTHLY_PAID_CAP} paid referrals this month. Your next one counts from the 1st.`,
        icon: "gift",
        link: "dashboard",
        ref: doc.id,
      });
      return;
    }

    const referrerReward = doc.reward || REFERRER_REWARD;
    const referredReward = doc.referredReward ?? REFERRED_REWARD;

    // Both rewards are promotional CREDIT: spendable on any product, never withdrawable,
    // expiring after 60 days (§3).
    await addCredit(doc.referrerId, {
      type: "referral",
      amount: referrerReward,
      days: CREDIT_EXPIRY_DAYS,
      ref: doc.id,
      note: `Referral credit · ${doc.referredName}'s first order delivered`,
    });
    await addCredit(doc.referredId, {
      type: "referral",
      amount: referredReward,
      days: CREDIT_EXPIRY_DAYS,
      ref: doc.id,
      note: `Welcome credit · referred by ${doc.referrerName}`,
    });

    await notifyUser(doc.referrerId, {
      type: "referral",
      title: `You earned ${ghs(referrerReward)} credit 🎉`,
      body: `${doc.referredName}'s first order was delivered. Your ${ghs(referrerReward)} referral credit is ready to spend — it expires in ${CREDIT_EXPIRY_DAYS} days.`,
      icon: "gift",
      link: "wallet",
      ref: doc.id,
    });
    await notifyUser(doc.referredId, {
      type: "referral",
      title: `Welcome credit · ${ghs(referredReward)}`,
      body: `Thanks for joining with ${doc.referrerName}'s code — ${ghs(referredReward)} credit is in your wallet and comes off your next order automatically. It expires in ${CREDIT_EXPIRY_DAYS} days.`,
      icon: "gift",
      link: "wallet",
      ref: doc.id,
    });
  } catch (e: any) {
    console.error("Referral qualify error:", e?.message);
  }
}

// ---- reporting ----

// One agent's referral panel: their code, who signed up, and what they've earned.
export async function referralStats(userId: string): Promise<{
  code: string;
  signedUp: number;
  qualified: number;
  pending: number;
  credit: number;
  reward: number;
  referredReward: number;
  expiryDays: number;
  monthlyCap: number;
  paidThisMonth: number;
  referrals: any[];
}> {
  const users = await getUsers();
  const me = usingMongo
    ? await users.findOne({ _id: new (await import("mongodb")).ObjectId(String(userId)) }).catch(() => null)
    : await users.findOne({ _id: String(userId) });
  const code = me ? await ensureRefCode(me) : "";

  const rows = (await queryReferrals({ referrerId: String(userId) })) as ReferralDoc[];
  const qualified = rows.filter((r) => r.status === "qualified");
  return {
    code,
    signedUp: rows.length,
    qualified: qualified.length,
    pending: rows.length - qualified.length,
    credit: Math.round(qualified.filter((r) => !r.blockedReason).reduce((s, r) => s + (r.reward || 0), 0) * 100) / 100,
    reward: REFERRER_REWARD,
    referredReward: REFERRED_REWARD,
    expiryDays: CREDIT_EXPIRY_DAYS,
    monthlyCap: MONTHLY_PAID_CAP,
    paidThisMonth: await paidThisMonth(String(userId)),
    referrals: rows.slice(0, 25).map((r) => ({
      id: r.id,
      name: r.referredName,
      phone: r.referredPhone,
      status: r.status,
      reward: r.reward,
      blockedReason: r.blockedReason || null,
      at: r.at,
      qualifiedAt: r.qualifiedAt || null,
    })),
  };
}

// Platform-wide referral report for the admin dashboard: headline totals, a leaderboard of
// the agents pulling in the most people, and the newest referral events.
export async function referralReport(): Promise<{
  totals: { signups: number; qualified: number; pending: number; creditPaid: number; referrers: number };
  leaderboard: any[];
  recent: any[];
}> {
  const [rows, users] = await Promise.all([queryReferrals({}), queryUsers({})]);
  const byId = new Map<string, any>();
  for (const u of users) byId.set(String(u._id), u);

  const board = new Map<string, any>();
  let qualified = 0;
  let creditPaid = 0;

  for (const r of rows as ReferralDoc[]) {
    const isQ = r.status === "qualified";
    // Both sides are credited, at different rates (§3), and a capped referral pays nothing.
    if (isQ) { qualified++; if (!r.blockedReason) creditPaid += (r.reward || 0) + (r.referredReward ?? REFERRED_REWARD); }

    let row = board.get(r.referrerId);
    if (!row) {
      const u = byId.get(r.referrerId);
      row = {
        id: r.referrerId,
        name: u?.business || u?.name || r.referrerName,
        role: u?.role || "customer",
        phone: u?.phone?.local || null,
        code: u?.refCode || r.code,
        signups: 0, qualified: 0, earned: 0, lastAt: 0,
      };
      board.set(r.referrerId, row);
    }
    row.signups++;
    if (isQ && !r.blockedReason) { row.qualified++; row.earned += r.reward || 0; }
    else if (isQ) row.qualified++;
    if ((r.at || 0) > row.lastAt) row.lastAt = r.at || 0;
  }

  const leaderboard = [...board.values()]
    .map((r) => ({ ...r, earned: Math.round(r.earned * 100) / 100 }))
    .sort((a, b) => b.qualified - a.qualified || b.signups - a.signups || b.lastAt - a.lastAt);

  const recent = (rows as ReferralDoc[]).slice(0, 20).map((r) => {
    const u = byId.get(r.referrerId);
    return {
      id: r.id,
      referrer: u?.business || u?.name || r.referrerName,
      code: r.code,
      name: r.referredName,
      phone: r.referredPhone,
      status: r.status,
      reward: r.reward,
      at: r.at,
      qualifiedAt: r.qualifiedAt || null,
    };
  });

  return {
    totals: {
      signups: rows.length,
      qualified,
      pending: rows.length - qualified,
      creditPaid: Math.round(creditPaid * 100) / 100,
      referrers: board.size,
    },
    leaderboard,
    recent,
  };
}
