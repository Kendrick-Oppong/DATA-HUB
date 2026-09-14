import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByRef, getOrderByProviderRef, applyStatus } from "@/lib/server/orders";
import {
  getStoreOrderByRef,
  getStoreOrderByProviderRef,
  applyStoreStatus,
} from "@/lib/server/storeOrders";
import { normalizeStatus } from "@/lib/server/providers/datahub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DataHub Ghana delivery callback → update the order (delivers, or fails + refunds the wallet).
//
// DataHub POSTs on every status change:
//   { event: "order.status.changed", timestamp,
//     data: { orderNumber, reference, status, oldStatus, network, phoneNumber,
//             dataAmount, amountPaid, createdAt, updatedAt } }
// where data.reference is the reference WE submitted (our order ref) and status is one of
// INITIATED | PENDING | PROCESSING | SUCCESSFUL | FAILED | CANCELLED.
//
// The webhook URL is registered per API KEY in DataHub's dashboard (not per transaction),
// so this endpoint's address is configured there:
//   https://<APP_BASE_URL>/api/webhooks/datahub
// with the same secret as DATAHUB_WEBHOOK_SECRET.
//
// Unlike HubNet, DataHub SIGNS its callbacks: HMAC-SHA256 over the raw body, in the
// X-Webhook-Signature header. We verify it whenever a secret is configured. Handler is
// idempotent (applyStatus delivers/refunds at most once), and DataHub retries 3× with
// exponential backoff, so a duplicate delivery is expected and harmless.
function verify(req: Request, raw: string): boolean {
  const secret = process.env.DATAHUB_WEBHOOK_SECRET || "";
  if (!secret) return true; // not configured → accept (dev/dry)

  const sent = (req.headers.get("x-webhook-signature") || "").trim().replace(/^sha256=/i, "");
  if (!sent) return false;

  const digest = crypto.createHmac("sha256", secret).update(raw, "utf8").digest();
  // The docs don't pin the encoding, so accept either of the two forms an HMAC-SHA256 is
  // normally written in. Compared with timingSafeEqual on equal-length buffers only.
  for (const enc of ["hex", "base64"] as const) {
    const a = Buffer.from(sent);
    const b = Buffer.from(digest.toString(enc));
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!verify(req, raw)) return NextResponse.json({ error: "Unrecognized sender." }, { status: 401 });

    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = {}; }
    const d = body?.data || body;

    // data.reference is our own order ref (we submit reference = order.ref).
    const ref = String(d.reference || "");
    const statusRaw = String(d.status || "");
    if (!ref) return NextResponse.json({ ok: true, note: "no reference" }); // ack malformed
    if (!statusRaw) return NextResponse.json({ error: "Missing status." }, { status: 400 });

    const status = normalizeStatus(statusRaw);

    // Resolve by our ref; fall back to providerRef (DataHub's orderNumber) just in case.
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
