import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getWallet } from "@/lib/server/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's wallet: cash balance, transaction history, and any promotional
// credit (referral rewards — spendable on products, never withdrawable, and expiring).
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const wallet = await getWallet(s.uid);
  return NextResponse.json(wallet);
}
