import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { verifyCode } from "@/lib/server/otp";
import { createWithdrawal, listWithdrawals, publicWithdrawal } from "@/lib/server/withdrawals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the signed-in agent's withdrawal history.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const list = await listWithdrawals(s.uid);
  return NextResponse.json({ withdrawals: list.map(publicWithdrawal) });
}

// Step 2 of a withdrawal: verify the emailed code, then debit the wallet and pay out to
// mobile money via Paystack. The payout details come from the code's stored payload, so
// they match exactly what was validated at start.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const me = await findUserById(s.uid);
    if (!me) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const otp = String(b.otp || "");

    const v = await verifyCode(me.phone.intl, "withdraw", otp);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    if (!v.payload)
      return NextResponse.json({ error: "This withdrawal expired — please start again." }, { status: 400 });

    const { amount, momoNumber, network, momoName } = v.payload;
    // The name the agent entered and then approved on the confirmation screen. Falls back to
    // the account name for a code issued before this field existed.
    const name = String(momoName || me.business || me.name || "Agent");

    const res = await createWithdrawal(s.uid, amount, { number: momoNumber, network, name });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });

    return NextResponse.json({ withdrawal: publicWithdrawal(res.withdrawal), balance: res.balance });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
