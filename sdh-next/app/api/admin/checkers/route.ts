import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { queryUsers } from "@/lib/server/db";
import { listAllCheckerOrders, publicCheckerOrder, fulfillCheckerOrder, refundCheckerOrder } from "@/lib/server/checkerOrders";
import { getCheckerPricing } from "@/lib/server/checkerPricing";
import { providerMode } from "@/lib/server/providers/datahub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — every result-checker order and DataHub's provider mode. Orders now deliver
// synchronously at purchase time (see app/api/checkers/route.ts), so "fulfil" only ever
// applies to a legacy Muviin order still stuck "processing" from before the switch.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [list, pricing] = await Promise.all([listAllCheckerOrders(), getCheckerPricing()]);
  // Join the buyer's name for the desk.
  const names = new Map<string, string>();
  try { for (const u of await queryUsers({})) names.set(String(u._id), u.business || u.name || "User"); } catch {}

  const orders = list.map((o) => ({ ...publicCheckerOrder(o), buyer: names.get(String(o.userId)) || "User" }));
  // { cardType, price } shape, matching what the desk already reads (id.toUpperCase() so
  // "wassce" → "WASSCE", the same key the desk's own product labels resolve to).
  const prices = pricing.map((p) => ({ cardType: p.id.toUpperCase(), price: p.supplier }));
  return NextResponse.json({ orders, prices, mode: providerMode() });
}

// Admin actions (legacy Muviin orders only — new orders deliver themselves at purchase time):
//   { ref, action: "fulfill", pin, serial }  — attach the voucher → SMS the buyer, deliver
//   { ref, action: "fail" }                   — refund the buyer
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  const ref = String(b.ref || "");
  if (!ref) return NextResponse.json({ error: "Missing order reference." }, { status: 400 });

  if (action === "fulfill") {
    const res = await fulfillCheckerOrder(ref, String(b.pin || ""), String(b.serial || ""));
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ order: publicCheckerOrder(res.order) });
  }
  if (action === "fail") {
    await refundCheckerOrder(ref, "declined by admin");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
