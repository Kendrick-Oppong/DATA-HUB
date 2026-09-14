import { NextResponse } from "next/server";
import { getStoreByHandle } from "@/lib/server/stores";
import { normalizeGhPhone } from "@/lib/server/phone";
import { initialize, paystackMode } from "@/lib/server/providers/paystack";
import { priceStoreData, priceMismatch } from "@/lib/server/pricing";
import { normalizeLine, type ProductLine } from "@/lib/server/providers/lines";
import { supportedNetwork } from "@/lib/server/providers/data";
import { isBlockedBeneficiary, beneficiaryBlock } from "@/lib/server/failedBeneficiaries";
import { toAirtimeNetwork } from "@/lib/server/providers/muviin";
import { MAX_AIRTIME, MIN_AIRTIME, priceAirtime } from "@/lib/server/airtimePricing";
import { createPendingStoreOrderPayment, capturePendingStoreOrder, newStoreOrderPayRef } from "@/lib/server/storeOrderPayments";
import { findPromo, discountFor, capDiscount } from "@/lib/server/promos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC — no auth (guest checkout). Start a real mobile-money payment for a DATA bundle or
// an AIRTIME top-up on an agent's storefront: price it server-side from the AGENT's saved
// store config, stash a pending order intent, and hand back Paystack's hosted-checkout URL.
// The order is NOT placed here — only after Paystack confirms payment (webhook / callback).
export async function POST(req: Request, { params }: { params: { handle: string } }) {
  try {
    if (paystackMode() === "dry")
      return NextResponse.json({ error: "Payments aren't available right now. Please try again later." }, { status: 503 });

    const storeDoc = await getStoreByHandle(params.handle);
    if (!storeDoc) return NextResponse.json({ error: "Store not found." }, { status: 404 });
    const config = storeDoc.config || {};
    if (config.open === false)
      return NextResponse.json({ error: "This store is currently closed." }, { status: 409 });

    const b = await req.json().catch(() => ({}));
    const net = String(b.net || "");

    // ---- AIRTIME ----
    // Sold at FACE VALUE, exactly as everywhere else in the platform: the guest pays the
    // credit amount and nothing more, and the agent earns nothing on it (Muviin settles the
    // platform's commission out of band). There is deliberately no agent markup and no
    // discount code here — a code is funded from the agent's margin, and on airtime there
    // isn't one to spend.
    if (String(b.type || "data") === "airtime") {
      if (config.airtime === false)
        return NextResponse.json({ error: "This store isn't selling airtime." }, { status: 400 });
      if (!toAirtimeNetwork(net)) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });
      if (config.nets && config.nets[net] === false)
        return NextResponse.json({ error: "This network isn't available in this store." }, { status: 400 });

      const phone = normalizeGhPhone(String(b.recipient || ""));
      if (!phone) return NextResponse.json({ error: "Enter a valid recipient number." }, { status: 400 });

      // Priced server-side from the face value alone — the client's amount is never trusted.
      const priced = priceAirtime(Number(b.amount));
      if (!priced)
        return NextResponse.json({ error: `Enter an airtime amount between ₵${MIN_AIRTIME} and ₵${MAX_AIRTIME}.` }, { status: 400 });

      const airMismatch = priceMismatch(b.expectedCost, priced.cost);
      if (airMismatch) return NextResponse.json({ error: airMismatch, cost: priced.cost }, { status: 409 });

      const payer = normalizeGhPhone(String(b.payerPhone || ""));
      const payNet = ["mtn", "telecel", "atigo"].includes(String(b.payNetwork)) ? String(b.payNetwork) : null;
      const email = `${phone.local}@guest.sdhghana.com`;
      const reference = newStoreOrderPayRef(storeDoc.handle);

      await createPendingStoreOrderPayment({
        reference,
        handle: storeDoc.handle,
        agentUserId: storeDoc.userId,
        email,
        amountGhs: priced.cost,
        type: "airtime",
        net,
        atProduct: null,
        capacityGb: 0,
        faceValue: priced.faceValue,
        pkg: priced.pkg,
        recipient: phone.local,
        payerPhone: payer?.local || null,
        payNetwork: payNet,
        // The platform buys the credit at face value too, so there's no margin on either
        // side — and therefore no tier bonus base and no agent commission.
        wholesale: priced.cost,
        supplierCost: priced.cost,
        commission: 0,
        promoCode: null,
        discount: 0,
      });

      const proto0 = req.headers.get("x-forwarded-proto") || "https";
      const host0 = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
      const origin0 = (process.env.APP_BASE_URL || `${proto0}://${host0}`).replace(/\/+$/, "");
      const initA = await initialize({
        email,
        amountGhs: priced.cost,
        reference,
        callbackUrl: `${origin0}/api/store/${encodeURIComponent(storeDoc.handle)}/pay/callback`,
        metadata: { purpose: "store_order_payment", handle: storeDoc.handle, type: "airtime", net, recipient: phone.local },
      });
      if (!initA.ok)
        return NextResponse.json({ error: initA.error || "Could not start payment." }, { status: 502 });
      // Checkout is live — capture the sale as "pending" so it exists (with its order number)
      // while the guest pays. Confirmation turns this same row into a real order.
      const orderRefA = await capturePendingStoreOrder(reference);
      return NextResponse.json({ authorizationUrl: initA.authorizationUrl, reference, orderRef: orderRefA });
    }

    const atProduct: ProductLine | undefined = normalizeLine(net, b.atProduct) ?? undefined;
    const capacityGb = Number(b.capacityGb);
    const phone = normalizeGhPhone(String(b.recipient || ""));
    const payer = normalizeGhPhone(String(b.payerPhone || ""));
    const payNetwork = ["mtn", "telecel", "atigo"].includes(String(b.payNetwork)) ? String(b.payNetwork) : null;

    if (!supportedNetwork(net, atProduct)) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });
    if (config.nets && config.nets[net] === false)
      return NextResponse.json({ error: "This network isn't available in this store." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Enter a valid recipient number." }, { status: 400 });

    // Blocked MTN beneficiary — refuse before Paystack opens. A guest has no wallet to refund
    // into, so taking money for an order that cannot be delivered is the worst outcome here.
    if (await isBlockedBeneficiary(net, phone.local)) {
      const block = beneficiaryBlock(phone.local);
      return NextResponse.json({ error: block.body[0], beneficiaryBlock: block }, { status: 409 });
    }

    // Price from the agent's stored config — the client's price is never trusted, so a
    // tampered request can't underpay.
    const priced = await priceStoreData(config, net, atProduct, capacityGb);
    if (!priced) return NextResponse.json({ error: "Choose a valid bundle." }, { status: 400 });
    if (priced.sell <= 0) return NextResponse.json({ error: "This bundle isn't available." }, { status: 400 });

    // Discount code — re-validated from the agent's stored codes. The checkout shows the
    // discounted total, so this is what we must actually charge. A code eats the agent's
    // margin only: capDiscount keeps the platform whole on the wholesale.
    const wantedCode = String(b.promoCode || "").trim();
    const promo = wantedCode ? findPromo(config, wantedCode, net) : null;
    // The customer was quoted a discount and is about to approve that amount. If the code
    // stopped being valid in between (its last use went to someone else, the agent paused
    // it), fail instead of quietly charging the undiscounted price.
    if (wantedCode && !promo)
      return NextResponse.json(
        { error: "That discount code is no longer available. Please re-apply it and try again." },
        { status: 409 }
      );
    const discount = promo ? capDiscount(discountFor(promo, priced.sell), priced.sell, priced.wholesale) : 0;
    const payable = Math.round((priced.sell - discount) * 100) / 100;
    if (payable <= 0) return NextResponse.json({ error: "This bundle isn't available." }, { status: 400 });

    // Never open Paystack for a total the checkout didn't display — the agent may have
    // republished their prices while the guest was filling the form.
    const mismatch = priceMismatch(b.expectedCost, payable);
    if (mismatch) return NextResponse.json({ error: mismatch, cost: payable }, { status: 409 });
    const commission = Math.max(0, Math.round((payable - priced.wholesale) * 100) / 100);

    // Paystack needs an email; a guest has none, so synthesize one from the recipient.
    const email = `${phone.local}@guest.sdhghana.com`;
    const reference = newStoreOrderPayRef(storeDoc.handle);

    await createPendingStoreOrderPayment({
      reference,
      handle: storeDoc.handle,
      agentUserId: storeDoc.userId,
      email,
      amountGhs: payable,
      net,
      atProduct: atProduct ?? null,
      capacityGb,
      pkg: priced.pkg,
      recipient: phone.local,
      payerPhone: payer?.local || null,
      payNetwork,
      wholesale: priced.wholesale,
      // The tier-bonus base travels with the intent, so a vendor-price edit between checkout
      // and delivery can't restate what the sale was worth.
      supplierCost: priced.supplier,
      commission,
      promoCode: promo ? promo.code : null,
      discount,
    });

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");

    const init = await initialize({
      email,
      amountGhs: payable,
      reference,
      callbackUrl: `${origin}/api/store/${encodeURIComponent(storeDoc.handle)}/pay/callback`,
      metadata: { purpose: "store_order_payment", handle: storeDoc.handle, net, capacityGb, recipient: phone.local },
    });
    if (!init.ok)
      return NextResponse.json({ error: init.error || "Could not start payment." }, { status: 502 });

    // Same capture for the data path — the sale exists from the moment checkout opens.
    const orderRef = await capturePendingStoreOrder(reference);

    return NextResponse.json({ authorizationUrl: init.authorizationUrl, reference, orderRef });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
