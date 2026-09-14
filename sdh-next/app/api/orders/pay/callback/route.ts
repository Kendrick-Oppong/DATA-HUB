import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/server/providers/paystack";
import { fulfillOrderPayment } from "@/lib/server/orderPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where Paystack redirects the user's browser after a direct order payment. The webhook
// is the authoritative fulfilment path; this is a UX backstop — we verify server-side and
// place the order (idempotently) so it's usually already on its way when the user lands
// back, then bounce them into the app.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref") || "";

  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");

  let status: "success" | "failed" | "pending" = "failed";
  if (reference) {
    const v = await verifyTransaction(reference);
    if (v.ok && v.paid) {
      await fulfillOrderPayment(reference);
      status = "success";
    } else if (v.ok && !v.paid) {
      status = "pending"; // not paid (abandoned/failed) — webhook may still settle it later
    }
  }

  return NextResponse.redirect(`${origin}/?orderpay=${status}`, 303);
}
