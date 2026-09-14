import { NextResponse } from "next/server";
import {
  getStoreOrderByRef,
  listStoreOrdersByRecipient,
  applyStoreStatus,
  publicStoreOrder,
  StoreOrderDoc,
} from "@/lib/server/storeOrders";
import { normalizeGhPhone } from "@/lib/server/phone";
import { dataOrderStatus } from "@/lib/server/providers/data";
import { airtimeStatus } from "@/lib/server/providers/muviin";
import { isInFlight } from "@/lib/orderStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reconcile one in-flight order against its provider (delivers, or fails + refunds) as a
// webhook backstop. This is also what advances a guest's tracking page from Waiting to
// Processing. Returns the order, updated if anything moved.
async function settle(order: StoreOrderDoc): Promise<StoreOrderDoc> {
  if (!isInFlight(order.status)) return order;
  try {
    // The provider's status lookup keys off the reference we submitted (= our order ref).
    // Route on the provider stored on the ORDER: airtime settles through Muviin, data
    // through whichever provider took that order.
    const st = order.provider === "muviin"
      ? await airtimeStatus(order.ref)
      : await dataOrderStatus(order.ref, order.provider, order.net);
    // applyStoreStatus filters out repeats, backwards moves and no-information polls.
    if (st.ok) {
      const res = await applyStoreStatus(order.ref, st.status);
      if (res.changed && res.order) return res.order;
    }
  } catch {
    // A provider having a bad day must not turn tracking into an error page — the stored
    // status is still worth showing.
  }
  return order;
}

// PUBLIC — no auth. A guest tracks their storefront order two ways:
//   ?ref=SO-K7M2XQ   the order number from their receipt
//   ?phone=024…      the number they bought FOR, when the receipt is long gone
//
// Both are scoped to the store handle so one store's orders can't be read from another, and
// the phone lookup returns only that number's own recent orders on that one store — the same
// information the buyer already has, never a wider view of the store's sales.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("ref") || "").trim();
  const phoneRaw = (url.searchParams.get("phone") || "").trim();
  const handle = (url.searchParams.get("handle") || "").trim().toLowerCase();

  // ---- By phone number ----
  if (phoneRaw && !ref) {
    if (!handle) return NextResponse.json({ error: "Open the store you ordered from to track by phone." }, { status: 400 });
    const phone = normalizeGhPhone(phoneRaw);
    if (!phone) return NextResponse.json({ error: "Enter a valid Ghanaian phone number." }, { status: 400 });

    const rows = await listStoreOrdersByRecipient(handle, phone.local);
    if (!rows.length)
      return NextResponse.json(
        { error: "No orders found for that number on this store. Try your order number instead." },
        { status: 404 }
      );

    // Only the newest is reconciled with the provider. The older ones are almost always
    // settled already, and tracking must not fan out into a provider call per order.
    const [newest, ...rest] = rows;
    const settled = await settle(newest);
    return NextResponse.json({
      order: publicStoreOrder(settled),
      orders: [settled, ...rest].map(publicStoreOrder),
    });
  }

  // ---- By order number ----
  if (!ref) return NextResponse.json({ error: "Enter your order number or phone number." }, { status: 400 });

  const found = await getStoreOrderByRef(ref);
  if (!found || (handle && found.handle !== handle))
    return NextResponse.json({ error: "No order found. Check the number and try again." }, { status: 404 });

  const order = await settle(found);
  return NextResponse.json({ order: publicStoreOrder(order), orders: [publicStoreOrder(order)] });
}
