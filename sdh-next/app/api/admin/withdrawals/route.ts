import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { platformWithdrawals } from "@/lib/server/adminReports";
import { dispatchWithdrawal, markWithdrawalPaid, rejectWithdrawal, listWithdrawalsByStatus } from "@/lib/server/withdrawals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Every agent payout on the platform for the Payouts page. Agents REQUEST
// payouts (wallet debited, status "requested"); an admin processes them here.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const withdrawals = await platformWithdrawals();
  return NextResponse.json({ withdrawals });
}

// Admin-only. Act on a payout request:
//   { reference, action: "pay" | "markPaid" | "reject" }  — one payout
//   { action: "payAll" }                                   — send every pending request via Paystack
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "payAll") {
    // Either an explicit set of references (a filtered "pay in view" run) or every pending one.
    let refs: string[];
    if (Array.isArray(b.references) && b.references.length) {
      refs = b.references.map((r: any) => String(r));
    } else {
      refs = (await listWithdrawalsByStatus("requested")).map((w) => w.reference);
    }
    let paid = 0, failed = 0;
    for (const ref of refs) {
      const r = await dispatchWithdrawal(ref);
      if (r.ok) paid++; else failed++;
    }
    return NextResponse.json({ ok: true, processed: refs.length, paid, failed });
  }

  const reference = String(b.reference || "");
  if (!reference) return NextResponse.json({ error: "Missing payout reference." }, { status: 400 });

  let res: { ok: boolean; error?: string };
  if (action === "pay") res = await dispatchWithdrawal(reference);
  else if (action === "markPaid") res = await markWithdrawalPaid(reference);
  else if (action === "reject") res = await rejectWithdrawal(reference);
  else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  if (!res.ok) return NextResponse.json({ error: res.error || "Could not update the payout." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
