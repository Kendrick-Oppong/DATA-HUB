import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { normalizeGhPhone } from "@/lib/server/phone";
import { initialize, paystackMode } from "@/lib/server/providers/paystack";
import { priceBundle, priceMismatch } from "@/lib/server/pricing";
import { priceAirtime, MIN_AIRTIME, MAX_AIRTIME } from "@/lib/server/airtimePricing";
import { normalizeLine, type ProductLine } from "@/lib/server/providers/lines";
import { supportedNetwork } from "@/lib/server/providers/data";
import { toAirtimeNetwork } from "@/lib/server/providers/muviin";
import { createPendingOrderPayment, capturePendingOrder, newOrderPayRef } from "@/lib/server/orderPayments";
import { isBlockedBeneficiary, beneficiaryBlock } from "@/lib/server/failedBeneficiaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start a direct order payment: price the bundle server-side, stash the order intent
// as pending, and hand back Paystack's hosted-checkout URL (mobile money / card / bank).
// The order is NOT placed here — only after Paystack confirms payment (webhook /
// callback). The client redirects the browser to the URL.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    if (paystackMode() === "dry")
      return NextResponse.json({ error: "Payments aren't configured yet. Please try again later." }, { status: 503 });

    const b = await req.json().catch(() => ({}));
    const isAirtime = String(b.type || "data") === "airtime";
    const net = String(b.net || "");
    // Product line within the network — see providers/lines.ts. Airtime has none.
    const atProduct: ProductLine | undefined = isAirtime ? undefined : (normalizeLine(net, b.atProduct) ?? undefined);
    const capacityGb = isAirtime ? 0 : Number(b.capacityGb);
    const phone = normalizeGhPhone(String(b.recipient || ""));

    const networkOk = isAirtime ? !!toAirtimeNetwork(net) : supportedNetwork(net, atProduct);
    if (!networkOk) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Enter a valid recipient number." }, { status: 400 });

    // Price is computed server-side from the authoritative table — the client's
    // cost/pkg are ignored, so a tampered request can't underpay.
    let cost: number, commission: number, pkg: string, faceValue: number | undefined;
    if (isAirtime) {
      const priced = priceAirtime(Number(b.amount));
      if (!priced)
        return NextResponse.json({ error: `Enter an airtime amount between ₵${MIN_AIRTIME} and ₵${MAX_AIRTIME}.` }, { status: 400 });
      ({ cost, commission, pkg, faceValue } = priced);
    } else {
      const priced = await priceBundle(net, atProduct, capacityGb, s.role);
      if (!priced) return NextResponse.json({ error: "Choose a valid bundle." }, { status: 400 });
      ({ cost, commission, pkg } = priced);
    }

    // Refuse to send the buyer to Paystack for an amount their screen didn't quote.
    const mismatch = priceMismatch(b.expectedCost, cost);
    if (mismatch) return NextResponse.json({ error: mismatch, cost }, { status: 409 });

    // Blocked MTN beneficiary — refuse before Paystack opens. Money taken here would have to
    // be refunded out of band, so the check belongs on this side of the handoff.
    if (!isAirtime && (await isBlockedBeneficiary(net, phone.local))) {
      const block = beneficiaryBlock(phone.local);
      return NextResponse.json({ error: block.body[0], beneficiaryBlock: block }, { status: 409 });
    }

    // Paystack needs an email; fall back to a synthetic one if the user has none.
    const user = await findUserById(s.uid);
    const email = (user?.email && String(user.email)) || `${user?.phone?.local || s.uid}@wallet.smartdatahub.gh`;

    const reference = newOrderPayRef(s.uid);
    await createPendingOrderPayment({
      reference,
      product: isAirtime ? "airtime" : "data",
      userId: s.uid,
      role: s.role,
      email,
      amountGhs: cost,
      net,
      atProduct: atProduct ?? null,
      capacityGb,
      faceValue,
      pkg,
      recipient: phone.local,
      commission,
    });

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");

    const init = await initialize({
      email,
      amountGhs: cost,
      reference,
      callbackUrl: `${origin}/api/orders/pay/callback`,
      metadata: { userId: s.uid, purpose: "order_payment", net, capacityGb, recipient: phone.local },
    });
    if (!init.ok)
      return NextResponse.json({ error: init.error || "Could not start payment." }, { status: 502 });

    // Checkout is live and the buyer is about to be sent to Paystack — capture the order now,
    // as "pending", so it's in their order list while they pay. It becomes a real, paid order
    // (Waiting) under the same order number once the payment is confirmed. Only after a
    // SUCCESSFUL initialize: if checkout never opened, there's nothing to capture.
    const orderRef = await capturePendingOrder(reference);

    return NextResponse.json({ authorizationUrl: init.authorizationUrl, reference, orderRef });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
