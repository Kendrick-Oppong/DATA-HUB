import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { platformOrders } from "@/lib/server/adminReports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Every order on the platform — signed-in buys and guest storefront sales —
// for the Order monitor.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const orders = await platformOrders();
  return NextResponse.json({ orders });
}
