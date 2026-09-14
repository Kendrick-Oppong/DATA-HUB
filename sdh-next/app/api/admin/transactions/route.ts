import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { platformTransactions } from "@/lib/server/adminReports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Every wallet transaction across all users — for the admin Transactions page.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const transactions = await platformTransactions();
  return NextResponse.json({ transactions });
}
