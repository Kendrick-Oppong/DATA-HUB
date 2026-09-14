import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/server/providers/paystack";
import { fulfillStoreOrderPayment } from "@/lib/server/storeOrderPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where Paystack redirects the guest's browser after a storefront order payment. The webhook
// is the authoritative fulfilment path; this is a UX backstop — we verify server-side and
// place the order (idempotently), then bounce the guest back to the storefront with the
// outcome (and the order ref, so the store can open live tracking).
export async function GET(req: Request, { params }: { params: { handle: string } }) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref") || "";

  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");
  const handle = encodeURIComponent(params.handle);

  let status: "success" | "failed" | "pending" = "failed";
  let ref = "";
  if (reference) {
    const v = await verifyTransaction(reference);
    if (v.ok && v.paid) {
      const f = await fulfillStoreOrderPayment(reference);
      ref = f.orderRef || "";
      status = "success"; // payment succeeded; delivery settles via the DataHub webhook/poller
    } else if (v.ok && !v.paid) {
      status = "pending"; // not paid (abandoned/failed) — webhook may still settle it later
    }
  }

  const q = `storepay=${status}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;
  return NextResponse.redirect(`${origin}/${handle}?${q}`, 303);
}
