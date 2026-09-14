import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { agentSalesReport } from "@/lib/server/adminReports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Cross-agent storefront sales & commissions — powers the All Agents and
// Commissions pages. Returns { agents: [...per-agent rollup...], orders: [...all sales...] }.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const report = await agentSalesReport();
  return NextResponse.json(report);
}
