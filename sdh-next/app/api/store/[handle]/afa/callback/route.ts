import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/server/providers/paystack";
import { fulfillAfaPayment } from "@/lib/server/afaPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where Paystack redirects the applicant's browser after paying an AFA fee on a storefront.
// The webhook is the authoritative path; this is a UX backstop — we verify server-side and
// create the registration (idempotently), then bounce back to the store with the outcome.
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
      const f = await fulfillAfaPayment(reference);
      ref = f.afaRef || "";
      status = "success";
    } else if (v.ok && !v.paid) {
      status = "pending";   // abandoned or failed — the webhook may still settle it later
    }
  }

  const q = `afapay=${status}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;
  return NextResponse.redirect(`${origin}/${handle}?${q}`, 303);
}
