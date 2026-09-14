import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { addTx, TxType } from "@/lib/server/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Clients may only post DEBITS from their own wallet. Credits (topup, refund) are
// money-in and must never be client-driven: top-ups are credited only after Paystack
// confirms payment (see /api/wallet/topup + /api/webhooks/paystack); refunds are
// issued server-side by the order flow.
const DEBIT_TYPES: TxType[] = ["purchase", "external"];

// Record a wallet DEBIT for the signed-in user. The server enforces the sign and
// rejects overdrafts, so the balance can't be forged client-side.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const type = b.type as TxType;
    const amount = Number(b.amount);

    if (!DEBIT_TYPES.includes(type))
      return NextResponse.json({ error: "Invalid transaction type." }, { status: 400 });
    if (!amount || Number.isNaN(amount))
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    if (amount >= 0)
      return NextResponse.json({ error: "Debit amount must be negative." }, { status: 400 });

    const res = await addTx(s.uid, { type, amount, ref: String(b.ref || ""), note: String(b.note || "") });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

    return NextResponse.json({ balance: res.balance, entry: res.entry });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
