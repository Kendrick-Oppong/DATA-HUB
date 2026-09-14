import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getOrderByRef, applyStatus, publicOrder } from "@/lib/server/orders";
import { dataOrderStatus } from "@/lib/server/providers/data";
import { airtimeStatus } from "@/lib/server/providers/muviin";
import { isInFlight } from "@/lib/orderStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fetch one order. If it's still in flight, reconcile against the provider
// (delivers or fails+refunds it) — a poll target for the buy screen and a backstop
// in case a webhook is missed.
export async function GET(_req: Request, { params }: { params: { ref: string } }) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let order = await getOrderByRef(params.ref);
  if (!order || order.userId !== s.uid)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Reconcile against whichever provider fulfils this order type. Airtime settles
  // asynchronously at Muviin and is looked up by OUR reference (extRef); data is looked up
  // by the provider's own transaction id.
  if (isInFlight(order.status)) {
    const st = order.provider === "muviin"
      ? await airtimeStatus(order.ref)
      : await dataOrderStatus(order.ref, order.provider, order.net);
    // applyStatus decides what's a real transition (it ignores repeats, backwards moves and
    // no-information polls), so hand it whatever the provider said.
    if (st && st.ok) {
      const res = await applyStatus(order.ref, st.status);
      if (res.changed && res.order) order = res.order;
    }
  }

  return NextResponse.json({ order: publicOrder(order) });
}
