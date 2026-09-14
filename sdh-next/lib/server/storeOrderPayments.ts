// Guest storefront order payments — a customer paying for DATA on an agent's public
// /<handle> store, straight from Paystack (mobile money / card). SERVER ONLY.
//
// Mirrors orderPayments.ts, but the buyer is a GUEST (no account/wallet) and the confirmed
// payment fulfils an order on the AGENT's behalf and credits the AGENT. Flow:
//   POST /api/store/<handle>/pay → price from the agent's saved config, stash a pending
//     intent, initialize Paystack → redirect the guest to hosted checkout.
//   Paystack confirms (webhook charge.success or the callback verify) → we place the order
//     with the provider exactly once (claim guard) and persist a store order. The agent is
//     credited on delivery; a rejected/failed order is refunded to the guest via Paystack.
import { getPayments } from "./db";
import type { ProductLine } from "./providers/lines";
import { purchaseData } from "./providers/data";
import { sendAirtime } from "./providers/muviin";
import {
  StoreOrderDoc,
  createStoreOrder,
  upsertStoreOrder,
  newStoreOrderRef,
  patchStoreOrder,
  settleDelivered,
} from "./storeOrders";
import { refundTransaction } from "./providers/paystack";
import { recordPromoUse } from "./promos";
import { captureBeneficiaryFailure } from "./failedBeneficiaries";

export interface StoreOrderPaymentDoc {
  reference: string;             // Paystack reference — the idempotency key (STOREPAY-…)
  kind: "storeorderpay";         // discriminator (shares the `payments` collection)
  handle: string;
  agentUserId: string;           // the agent to credit
  email: string;                 // synthetic guest email for Paystack
  amountGhs: number;             // what the guest pays (= agent's sell price)
  type?: "data" | "airtime";     // absent on records written before airtime existed → data
  net: string;                   // mtn | telecel | atigo
  atProduct: ProductLine | null;  // data only: the product LINE (see providers/lines.ts)
  capacityGb: number;            // data only
  faceValue?: number;            // airtime only — credit the recipient receives
  pkg: string;
  recipient: string;             // local phone (0XXXXXXXXX) that receives the data/credit
  payerPhone: string | null;     // MoMo number the guest pays from (info only)
  payNetwork: string | null;     // wallet the guest pays from (info only)
  wholesale: number;             // what the AGENT pays the platform
  supplierCost?: number;         // what the platform pays the provider — the tier-bonus base
  commission: number;            // agent margin (already net of any discount)
  promoCode?: string | null;     // discount code applied, counted once the order is placed
  discount?: number;             // GH₵ taken off the agent's price by that code
  status: "pending" | "fulfilled";
  at: number;
  fulfilledAt?: number;
  orderRef?: string;             // the store order we created once paid
}

export function newStoreOrderPayRef(handle: string): string {
  const h = String(handle || "").replace(/[^a-z0-9-]/gi, "").slice(0, 20);
  return `STOREPAY-${h}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// The webhook uses this to route a reference to the right fulfiller.
export function isStoreOrderPayRef(reference: string): boolean {
  return reference.startsWith("STOREPAY-");
}

// Record the payment intent. The ORDER's ref is allocated here (not at fulfilment) so the
// captured order and the payment share one id — and so the guest can be given their order
// number before they pay.
export async function createPendingStoreOrderPayment(
  p: Omit<StoreOrderPaymentDoc, "kind" | "status" | "at" | "orderRef">
): Promise<string> {
  const payments = await getPayments();
  const orderRef = await newStoreOrderRef();
  await payments.insertOne({ ...p, orderRef, kind: "storeorderpay", status: "pending", at: Date.now() } as StoreOrderPaymentDoc);
  return orderRef;
}

// Capture the ORDER ITSELF at the moment the guest is handed off to Paystack, as "pending".
//
// A guest who paid but whose confirmation never reached us used to have no order at all — no
// number to quote, nothing for the agent or an admin to find. Now the sale exists from the
// hand-off, and the confirmed payment turns that same row into a real order under the SAME
// order number (see fulfillStoreOrderPayment). Nothing reaches a provider until then.
export async function capturePendingStoreOrder(reference: string): Promise<string | null> {
  const payments = await getPayments();
  const doc = (await payments.findOne({ reference })) as StoreOrderPaymentDoc | null;
  if (!doc || doc.kind !== "storeorderpay" || !doc.orderRef) return null;
  const isAirtime = doc.type === "airtime";
  const now = Date.now();
  try {
    await createStoreOrder({
      ref: doc.orderRef,
      handle: doc.handle,
      agentUserId: doc.agentUserId,
      // The real provider is stamped on fulfilment — nothing has been sent yet.
      provider: isAirtime ? "muviin" : "datahub",
      type: isAirtime ? "airtime" : "data",
      net: doc.net,
      atProduct: doc.atProduct,
      capacityGb: doc.capacityGb,
      faceValue: doc.faceValue ?? 0,
      pkg: doc.pkg,
      recipient: doc.recipient,
      payerPhone: doc.payerPhone,
      payNetwork: doc.payNetwork,
      sell: doc.amountGhs,
      wholesale: doc.wholesale,
      commission: doc.commission,
      commissionCredited: false,
      ...(doc.supplierCost > 0 ? { supplierCost: doc.supplierCost } : {}),
      providerRef: null,
      status: "pending",
      refunded: false,
      paymentRef: reference,
      at: now,
      updatedAt: now,
    });
  } catch (e: any) {
    // Capture is a safety net, never a gate on checkout.
    console.error(`Store order capture failed for ${reference}:`, e?.message);
    return null;
  }
  return doc.orderRef;
}

// Fulfil a confirmed guest payment — exactly once. Returns the created order ref so the
// callback can deep-link the guest to tracking.
export async function fulfillStoreOrderPayment(
  reference: string
): Promise<{ fulfilled: boolean; orderRef?: string; reason?: string }> {
  const payments = await getPayments();
  const doc = (await payments.findOne({ reference })) as StoreOrderPaymentDoc | null;
  if (!doc || doc.kind !== "storeorderpay") return { fulfilled: false, reason: "unknown reference" };
  if (doc.status === "fulfilled") return { fulfilled: false, orderRef: doc.orderRef, reason: "already fulfilled" };

  // Claim the payment: only the caller that flips pending → fulfilled places the order.
  const claim = await payments.updateOne(
    { reference, status: "pending" },
    { $set: { status: "fulfilled", fulfilledAt: Date.now() } }
  );
  if (!claim || (claim as any).matchedCount === 0) {
    const now = (await payments.findOne({ reference })) as StoreOrderPaymentDoc | null;
    return { fulfilled: false, orderRef: now?.orderRef, reason: "already fulfilled" };
  }

  // Reuse the ref allocated at intent time so the paid sale REPLACES the captured "pending"
  // row under the same order number. Old intents predate capture → new ref.
  const orderRef = doc.orderRef || (await newStoreOrderRef());
  const isAirtime = doc.type === "airtime";

  const baseOrder: Omit<StoreOrderDoc, "status" | "providerRef"> = {
    ref: orderRef,
    handle: doc.handle,
    agentUserId: doc.agentUserId,
    provider: isAirtime ? "muviin" : "datahub",
    type: isAirtime ? "airtime" : "data",
    net: doc.net,
    atProduct: doc.atProduct,
    capacityGb: doc.capacityGb,
    faceValue: doc.faceValue ?? 0,
    pkg: doc.pkg,
    recipient: doc.recipient,
    payerPhone: doc.payerPhone,
    payNetwork: doc.payNetwork,
    sell: doc.amountGhs,
    wholesale: doc.wholesale,
    commission: doc.commission,
    commissionCredited: false,
    ...(doc.supplierCost > 0 ? { supplierCost: doc.supplierCost } : {}),
    refunded: false,
    paymentRef: reference,
    at: Date.now(),
    updatedAt: Date.now(),
    // The provider handoff happens a few lines below, inside the guarded block. Stamping it
    // here rather than there keeps it on baseOrder, so the failure path carries it too — a
    // rejected order was still sent, and the timeline should say when.
    sentAt: Date.now(),
  };

  // Record the sale as failed and give the guest their money back. Used both for a clean
  // provider rejection and for an unexpected crash — in either case the guest paid and is
  // getting nothing, so the money has to go back.
  const failAndRefund = async (reason: string): Promise<{ fulfilled: false; orderRef: string; reason: string }> => {
    const failed: StoreOrderDoc = { ...baseOrder, providerRef: null, status: "failed", refunded: true, failedAt: Date.now() };
    try { await upsertStoreOrder(failed); } catch (e: any) { console.error(`Store order ${orderRef} record failed:`, e?.message); }
    try { await payments.updateOne({ reference }, { $set: { orderRef } }); } catch {}
    const r = await refundTransaction(reference, doc.amountGhs);
    if (!r.ok) console.error(`Store order ${orderRef} auto-refund failed:`, r.error);
    else await patchStoreOrder(orderRef, { refundedAt: Date.now() });
    return { fulfilled: false, orderRef, reason };
  };

  // Everything past the claim runs guarded. The claim above is one-way: no retry will ever
  // re-enter this function for this reference, so anything that throws here would leave the
  // guest paid, undelivered, unrefunded and with no order to show for it — which is exactly
  // what a missing import did to four real customers on 5 Aug 2026. A crash must cost us a
  // refund, never a customer's money.
  try {
    const result = isAirtime
      ? await sendAirtime({
          phoneNumber: doc.recipient,
          network: doc.net,
          amountGhs: doc.faceValue || doc.amountGhs,
          reference: orderRef,
        })
      : await purchaseData({
          phoneNumber: doc.recipient,
          network: doc.net,
          atProduct: doc.atProduct || undefined,
          capacityGb: doc.capacityGb,
          reference: orderRef,
        });

    if (!result.ok) {
      // A guest's beneficiary rejection matters most of all — the buyer has no account, so
      // nobody would otherwise know the number needs adding. Attributed to the AGENT whose
      // store took the order, since they're the one the customer will chase.
      if (!isAirtime) {
        await captureBeneficiaryFailure({
          phoneNumber: doc.recipient,
          errorMessage: (result as any).error || "",
          orderRef,
          net: doc.net,
          userId: doc.agentUserId,
          role: "agent",
        });
      }
      // Paid us, but the provider rejected it → refund the guest to their MoMo/card and
      // record the order as failed so it shows as refunded in tracking / the agent's sales.
      return await failAndRefund((result as any).error);
    }

    const order: StoreOrderDoc = {
      ...baseOrder,
      providerRef: isAirtime ? (result as any).transactionId || null : (result as any).providerRef,
      status: result.status,
      // Record the instant for whichever stage the provider already reports in this reply,
      // so no reached stage is left with a blank time.
      processingAt: result.status === "processing" ? Date.now() : undefined,
      deliveredAt: result.status === "delivered" ? Date.now() : undefined,
    };
    await upsertStoreOrder(order);
    await payments.updateOne({ reference }, { $set: { orderRef } });
    // The code is only "used" once we've actually placed the order — a rejected one is
    // refunded in full, so it shouldn't burn a redemption.
    if (doc.promoCode) await recordPromoUse(doc.handle, doc.promoCode);

    // If the provider delivered instantly, credit the agent + text the recipient now;
    // otherwise the delivery webhook / tracking poller settles it once the order lands
    // (see applyStoreStatus).
    if (order.status === "delivered") await settleDelivered(order);

    return { fulfilled: true, orderRef };
  } catch (e: any) {
    console.error(`Store order ${orderRef} fulfilment crashed:`, e?.stack || e?.message);
    return await failAndRefund("Something went wrong fulfilling this order. You have been refunded.");
  }
}
