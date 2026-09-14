import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { normalizeGhPhone } from "@/lib/server/phone";
import { refundSpend, spend } from "@/lib/server/wallet";
import { normalizeLine, type ProductLine } from "@/lib/server/providers/lines";
import { purchaseData, supportedNetwork } from "@/lib/server/providers/data";
import { priceBundle, priceMismatch } from "@/lib/server/pricing";
import { createOrder, listOrders, newOrderRef, onOrderDelivered, publicOrder, reconcilePending, OrderDoc } from "@/lib/server/orders";
import { sendDeliveryEmail, sendDeliverySms } from "@/lib/server/notify";
import { notifyUser } from "@/lib/server/notifications";
import { priceAirtime, MIN_AIRTIME, MAX_AIRTIME } from "@/lib/server/airtimePricing";
import { sendAirtime, toAirtimeNetwork } from "@/lib/server/providers/muviin";
import { captureBeneficiaryFailure, isBeneficiaryError, isBlockedBeneficiary, beneficiaryBlock } from "@/lib/server/failedBeneficiaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the signed-in user's real orders. Anything still in flight is settled here — no data
// or airtime provider calls us back reliably — so opening Orders finishes what's hanging.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  // Reconciliation must never be able to hide someone's order history: if a provider is
  // slow or down, fall back to what's stored.
  const stored = await listOrders(s.uid);
  let orders = stored;
  try { orders = await reconcilePending(stored); } catch (e: any) { console.error("Orders reconciliation skipped:", e?.message); }
  return NextResponse.json({ orders: orders.map(publicOrder) });
}

// Buy AIRTIME: debit the wallet → send it via Muviin → persist the order.
// Airtime is face value for everyone — no reseller discount, no commission (Muviin settles
// ours separately). Same money guarantees as data: the wallet is debited first
// (authoritative overdraft check), and a provider rejection refunds it immediately so the
// buyer is never charged for credit that didn't go out.
async function buyAirtime(b: any, s: { uid: string; role: string }) {
  const net = String(b.net || "");
  const phone = normalizeGhPhone(String(b.recipient || ""));

  if (!toAirtimeNetwork(net)) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Enter a valid recipient number." }, { status: 400 });

  // Priced server-side — the client's cost is ignored.
  const priced = priceAirtime(Number(b.amount));
  if (!priced)
    return NextResponse.json({ error: `Enter an airtime amount between ₵${MIN_AIRTIME} and ₵${MAX_AIRTIME}.` }, { status: 400 });
  const { faceValue, cost, commission, pkg } = priced;

  const ref = await newOrderRef();

  // 1. Debit the wallet. Promotional referral credit is spent first, then real cash.
  const debit = await spend(s.uid, { amount: cost, ref, note: `${pkg} · ${phone.local}` });
  if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });

  // 2. Send it. `sentAt` is stamped immediately before the handoff, so the timeline shows
  // when the provider actually received the order rather than when the row was written.
  const sentAt = Date.now();
  const result = await sendAirtime({ phoneNumber: phone.local, network: net, amountGhs: faceValue, reference: ref });
  if (!result.ok) {
    await refundSpend(s.uid, { cash: debit.paidFromCash, credit: debit.paidFromCredit, ref, note: `Refund · ${pkg} (not sent)` });
    return NextResponse.json(
      { error: result.error || "Could not send the airtime. You were not charged." },
      { status: 502 }
    );
  }

  // 3. Persist.
  const now = Date.now();
  const order: OrderDoc = {
    ref, userId: s.uid, providerRef: result.transactionId || null, provider: "muviin",
    role: s.role, type: "airtime", net, capacityGb: 0, faceValue, pkg,
    recipient: phone.local, cost, commission,
    status: result.status, refunded: false, at: now, updatedAt: now, sentAt,
    // Muviin can confirm in the same call; that's a real delivery instant, not an estimate.
    ...(result.status === "processing" ? { processingAt: now } : {}),
    ...(result.status === "delivered" ? { deliveredAt: now } : {}),
  };
  await createOrder(order);

  if (order.status === "delivered") {
    // These don't depend on each other, so they run together rather than as four sequential
    // round-trips the buyer sits through. All three swallow their own errors — none of them
    // can fail the purchase, which has already happened.
    await Promise.allSettled([
      sendDeliverySms({ recipient: phone.local, pkg, net, ref }),
      sendDeliveryEmail({ userId: s.uid, pkg, net, recipient: phone.local, ref, cost }),
      notifyUser(s.uid, {
        type: "order",
        title: "Airtime delivered",
        body: `${pkg} has been sent to ${phone.local}.`,
        icon: "phone",
        link: "orders",
        ref,
      }),
      onOrderDelivered(order),
    ]);
  }

  return NextResponse.json({ order: publicOrder(order), balance: debit.balance });
}

// Buy a data bundle: debit the SDH wallet → place the order with DataHub → persist.
// If the provider rejects it, the wallet debit is refunded so the customer isn't charged.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));

    // ---- Airtime top-up (Muviin) ----
    if (String(b.type || "data") === "airtime") return buyAirtime(b, s);

    const net = String(b.net || "");
    // The product LINE within the network — MTN standard/Xpress, AT iShare/BigTime. Carried
    // on the wire as `atProduct` for historical reasons (see providers/lines.ts).
    const atProduct: ProductLine | undefined = normalizeLine(net, b.atProduct) ?? undefined;
    const capacityGb = Number(b.capacityGb);
    const phone = normalizeGhPhone(String(b.recipient || ""));

    if (!supportedNetwork(net, atProduct)) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Enter a valid recipient number." }, { status: 400 });

    // Price is computed server-side from the authoritative table — the client's
    // cost/commission/pkg are ignored, so a tampered request can't underpay.
    const priced = await priceBundle(net, atProduct, capacityGb, s.role);
    if (!priced) return NextResponse.json({ error: "Choose a valid bundle." }, { status: 400 });
    const { cost, commission, pkg } = priced;

    // Refuse to debit the wallet for an amount the buy screen didn't quote. Checked before
    // spend() so a mismatch costs the buyer nothing — no debit to unwind.
    const mismatch = priceMismatch(b.expectedCost, cost);
    if (mismatch) return NextResponse.json({ error: mismatch, cost }, { status: 409 });

    // MTN has already refused this number and it hasn't been fixed upstream yet — stop here,
    // before spend(), so the buyer is never charged for an order that cannot be delivered.
    if (await isBlockedBeneficiary(net, phone.local)) {
      const block = beneficiaryBlock(phone.local);
      return NextResponse.json({ error: block.body[0], beneficiaryBlock: block }, { status: 409 });
    }

    // Captured per order: the tier bonus is (wholesale − supplier) × rate, and both sides of
    // that must be the figures as they were when the order was placed.
    const supplierCost = priced.supplier;
    const wholesale = priced.reseller;

    const ref = await newOrderRef();

    // 1. Debit the customer's SDH wallet (rejects on insufficient balance). Promotional
    // referral credit is spent before real cash, which is what makes it "spendable on any
    // product" without ever being withdrawable.
    const debit = await spend(s.uid, { amount: cost, ref, note: `${pkg} · ${phone.local}` });
    if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });

    // 2. Place the order with the provider. `sentAt` is stamped immediately before the
    // handoff, so the timeline shows when the provider actually received the order.
    const sentAt = Date.now();
    const result = await purchaseData({ phoneNumber: phone.local, network: net, atProduct, capacityGb, reference: ref });
    if (!result.ok) {
      // MTN beneficiary rejections need a human to add the number upstream, so the failure is
      // logged to the admin tracker automatically. Best-effort and awaited before the refund
      // only because it can't throw — captureBeneficiaryFailure swallows its own errors.
      await captureBeneficiaryFailure({
        phoneNumber: phone.local,
        errorMessage: (result as any).error || "",
        orderRef: ref,
        net,
        userId: s.uid,
        role: s.role === "admin" ? "admin" : s.role === "reseller" ? "agent" : "customer",
      });
      await refundSpend(s.uid, { cash: debit.paidFromCash, credit: debit.paidFromCredit, ref, note: `Refund · ${pkg} (order not placed)` });
      // First time MTN refuses this number: it has just been recorded above, so show the buyer
      // the same caution they'd get on a retry rather than the provider's raw wording.
      const firstBlock = isBeneficiaryError((result as any).error || "");
      return NextResponse.json(
        {
          error: result.error || "Could not place the order. You were not charged.",
          ...(firstBlock ? { beneficiaryBlock: beneficiaryBlock(phone.local) } : {}),
        },
        { status: 502 }
      );
    }

    // 3. Persist the order.
    const order: OrderDoc = {
      ref,
      userId: s.uid,
      providerRef: result.providerRef,
      provider: result.provider,
      ...(result.cost != null ? { providerCost: result.cost } : {}),
      ...(supplierCost > 0 ? { supplierCost } : {}),
      wholesale,
      role: s.role,
      type: "data",
      net,
      capacityGb,
      pkg,
      recipient: phone.local,
      cost,
      commission,
      status: result.status,
      refunded: false,
      at: Date.now(),
      updatedAt: Date.now(),
      sentAt,
      // The provider can report either state in the same call — record that instant now rather
      // than leaving the receipt with no time against the stage it already reached.
      ...(result.status === "processing" ? { processingAt: Date.now() } : {}),
      ...(result.status === "delivered" ? { deliveredAt: Date.now() } : {}),
    };
    await createOrder(order);

    // Only text the recipient if the provider confirmed delivery immediately. Otherwise the
    // order is still processing — the SMS is sent later when the delivery webhook
    // settles it (see applyStatus). Best-effort — never blocks or fails the purchase.
    if (order.status === "delivered") {
      await Promise.allSettled([
        sendDeliverySms({ recipient: phone.local, pkg, net, ref }),
        sendDeliveryEmail({ userId: s.uid, pkg, net, recipient: phone.local, ref, cost }),
        notifyUser(s.uid, {
          type: "order",
          title: "Data delivered",
          body: `${pkg} has been sent to ${phone.local}.`,
          link: "orders",
          ref,
        }),
        onOrderDelivered(order),
      ]);
    }

    return NextResponse.json({ order: publicOrder(order), balance: debit.balance });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
