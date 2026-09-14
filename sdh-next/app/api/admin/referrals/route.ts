import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { referralReport } from "@/lib/server/referrals";
import { incentiveReport } from "@/lib/server/incentiveReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — everything the incentive programme pays out: referral performance (totals,
// leaderboard, newest events) plus the tier/bonus/override report that powers the
// Referrals & Tiers page.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [referrals, incentives] = await Promise.all([referralReport(), incentiveReport()]);
  return NextResponse.json({ ...referrals, incentives });
}
