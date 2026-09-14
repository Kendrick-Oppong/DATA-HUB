import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/server/providers/paystack";
import { creditTopup } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where Paystack redirects the user's browser after payment. The webhook is the
// authoritative crediting path; this is a UX backstop — we verify server-side and
// credit (idempotently) so the balance is usually up to date the moment the user
// lands back, then bounce them into the app.
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
      await creditTopup(reference, v.amountGhs);
      status = "success";
    } else if (v.ok && !v.paid) {
      status = "pending"; // not paid (abandoned/failed) — webhook may still settle it later
    }
  }

  return NextResponse.redirect(`${origin}/?topup=${status}`, 303);
}
