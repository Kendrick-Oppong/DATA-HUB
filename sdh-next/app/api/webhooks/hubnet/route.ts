import { NextResponse } from "next/server";
import { getOrderByRef, getOrderByProviderRef, applyStatus } from "@/lib/server/orders";
import {
  getStoreOrderByRef,
  getStoreOrderByProviderRef,
  applyStoreStatus,
} from "@/lib/server/storeOrders";
import { normalizeStatus } from "@/lib/server/providers/hubnet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// HubNet delivery callback → update the order (delivers, or fails + refunds the wallet).
// HubNet POSTs on every status change (events: transfer.processing, transfer.delivered):
//   { event, status, message, code, data: { status, msisdn, network, volume, reference } }
// where data.reference is the reference WE submitted (our order ref).
//
// HubNet does not sign webhooks. We optionally protect the callback with a shared secret
// carried in the URL (?token=…) — we set it ourselves when building the webhook URL, so
// it's checked here when HUBNET_WEBHOOK_SECRET is configured. Handler is idempotent
// (applyStatus refunds/delivers at most once).
function verify(req: Request): boolean {
  const secret = process.env.HUBNET_WEBHOOK_SECRET || "";
  if (!secret) return true; // not configured → accept (dev/dry)
  const token = new URL(req.url).searchParams.get("token") || "";
  return token === secret;
}

export async function POST(req: Request) {
  try {
    if (!verify(req)) return NextResponse.json({ error: "Unrecognized sender." }, { status: 401 });

    const raw = await req.text();
    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = {}; }
    const d = body?.data || body;

    // data.reference is our own order ref (we submit reference = order.ref).
    const ref = String(d.reference || "");
    const statusRaw = String(d.status || d.state || "");
    if (!ref) return NextResponse.json({ ok: true, note: "no reference" }); // ack malformed
    if (!statusRaw) return NextResponse.json({ error: "Missing status." }, { status: 400 });

    const status = normalizeStatus(statusRaw);

    // Resolve by our ref; fall back to providerRef (HubNet's transaction_id) just in case.
    // A ref belongs to either a signed-in order (orders.ts) or a guest storefront order
    // (storeOrders.ts) — try both. Both settlers are idempotent.
    let order = await getOrderByRef(ref);
    if (!order) order = await getOrderByProviderRef(ref);
    if (order) {
      await applyStatus(order.ref, status);
      return NextResponse.json({ ok: true });
    }

    let sOrder = await getStoreOrderByRef(ref);
    if (!sOrder) sOrder = await getStoreOrderByProviderRef(ref);
    if (sOrder) {
      await applyStoreStatus(sOrder.ref, status);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, note: "no matching order" }); // ack unknown refs
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
