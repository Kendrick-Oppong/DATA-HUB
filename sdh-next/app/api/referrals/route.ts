import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserByRefCode, normalizeCode, referralStats } from "@/lib/server/referrals";
import { overrideStats } from "@/lib/server/overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's referral panel: their code, who joined, and what they've earned.
// ?check=CODE validates a code for the signup form (public — no session needed).
export async function GET(req: Request) {
  const check = new URL(req.url).searchParams.get("check");
  if (check !== null) {
    const code = normalizeCode(check);
    const owner = code ? await findUserByRefCode(code) : null;
    return NextResponse.json({
      valid: !!owner,
      code,
      referrer: owner ? String(owner.business || owner.name || "an agent") : null,
    });
  }

  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  // §3 referral panel plus, for resellers, the §4 recruitment-override panel.
  const [referrals, override] = await Promise.all([
    referralStats(s.uid),
    s.role === "reseller" ? overrideStats(s.uid) : Promise.resolve(null),
  ]);
  return NextResponse.json({ ...referrals, override });
}
