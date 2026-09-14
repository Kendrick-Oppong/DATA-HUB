import { NextResponse } from "next/server";
import { getOrderByRef, getOrderByProviderRef, applyStatus } from "@/lib/server/orders";
import { getStoreOrderByRef, getStoreOrderByProviderRef, applyStoreStatus } from "@/lib/server/storeOrders";
import { orderStatus } from "@/lib/server/providers/ghdataconnect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GHDataConnect delivery callback. Set the URL on their dashboard (Profile → API Access):
//   https://<your-domain>/api/webhooks/ghdataconnect?token=<GHDC_WEBHOOK_SECRET>
//
// TREATED AS A NUDGE, NOT AS TRUTH.
//
// Their webhook payload isn't documented and isn't signed, so this handler never takes a
// status from the request body. It only reads the order reference out of it, then asks
// GHDataConnect's own checkOrderStatus what the state really is and settles from that. The
// consequences of a wrong "delivered" are real — it pays the tier bonus, qualifies a
// referral and closes the order — so a forged or malformed POST must not be able to cause
// one. The round-trip also means we don't have to guess their field names correctly: any
// shape we can find a reference in works, and a shape we can't is simply ignored.
//
// Delivery is still reconciled by polling (reconcilePending on the orders list and the admin
// monitor), so this is an accelerator: it settles an order in seconds instead of whenever
// someone next loads a page. Losing a webhook costs latency, never correctness.
//
// Idempotent: applyStatus / applyStoreStatus deliver, fail and refund at most once each.

// Optional shared secret in the URL, mirroring the HubNet callback. Set GHDC_WEBHOOK_SECRET
// and include ?token=… in the URL you register with them.
function verify(req: Request): boolean {
  const secret = process.env.GHDC_WEBHOOK_SECRET || "";
  if (!secret) return true; // not configured → accept (dev)
  return (new URL(req.url).searchParams.get("token") || "") === secret;
}

// Dig a reference out of whatever they send. We submit `reference` as our own order ref, so
// that's what we're looking for, wherever it sits.
function findReference(body: any, url: URL): string {
  const candidates = [
    body?.reference, body?.data?.reference, body?.order?.reference,
    body?.extRef, body?.data?.extRef, body?.order_reference, body?.data?.order_reference,
    url.searchParams.get("reference"),
  ];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  return "";
}

export async function POST(req: Request) {
  try {
    if (!verify(req)) return NextResponse.json({ error: "Unrecognized sender." }, { status: 401 });

    const url = new URL(req.url);
    let body: any = {};
    try { body = JSON.parse(await req.text()); } catch { body = {}; }

    const ref = findReference(body, url);
    // Ack anything we can't read — retrying it would never help, and a non-2xx may make them
    // back off from callbacks we DO care about.
    if (!ref) return NextResponse.json({ ok: true, note: "no reference in payload" });

    // Ask THEM what the status is. The body's own status field is deliberately ignored.
    const st = await orderStatus(ref);
    if (!st.ok) return NextResponse.json({ ok: true, note: "status lookup failed; polling will settle it" });
    // In-flight statuses are NOT short-circuited: "processing" is a real stage change from
    // "waiting" that the customer sees. applyStatus/applyStoreStatus ignore the rest
    // (repeats, backwards moves, no-information lookups).

    // A ref belongs to either a signed-in order or a guest storefront order — try both.
    let order = await getOrderByRef(ref);
    if (!order) order = await getOrderByProviderRef(ref);
    if (order) {
      await applyStatus(order.ref, st.status);
      return NextResponse.json({ ok: true, ref, status: st.status });
    }

    let sOrder = await getStoreOrderByRef(ref);
    if (!sOrder) sOrder = await getStoreOrderByProviderRef(ref);
    if (sOrder) {
      await applyStoreStatus(sOrder.ref, st.status);
      return NextResponse.json({ ok: true, ref, status: st.status });
    }

    return NextResponse.json({ ok: true, note: "no matching order" });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

// Some providers probe a callback URL with a GET before accepting it.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "ghdataconnect-webhook" });
}
