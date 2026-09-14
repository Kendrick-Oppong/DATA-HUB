// Direct order payments — pay for a data bundle straight from Paystack (mobile money
// / card / bank) instead of the wallet. SERVER ONLY.
//
// Mirrors payments.ts (wallet top-ups) but the confirmed payment *fulfils an order*
// rather than crediting the wallet. Flow:
//   POST /api/orders/pay  → price the bundle, store a pending order intent, initialize
//     Paystack → redirect the user to the hosted checkout.
//   Paystack confirms (webhook `charge.success` or the callback verify) → we place the
//     order with the provider, exactly once (claim guard), and persist it.
//   If the provider rejects a *paid* order, we credit the buyer's wallet with what they
//     paid (the app's "auto-refund if it fails" promise) and record a failed order.
import { getPayments } from "./db";
import type { ProductLine } from "./providers/lines";
import { purchaseData } from "./providers/data";
import { sendAirtime } from "./providers/muviin";
import { createOrder, upsertOrder, newOrderRef, onOrderDelivered, OrderDoc } from "./orders";
import { addTx } from "./wallet";
import { sendDeliveryEmail, sendDeliverySms } from "./notify";
import { captureBeneficiaryFailure } from "./failedBeneficiaries";
import { ghs, notifyUser } from "./notifications";

export interface OrderPaymentDoc {
  reference: string;             // Paystack reference — the idempotency key (ORDPAY-…)
  kind: "orderpay";              // discriminator (payments.ts top-ups have no `kind`)
  product?: "data" | "airtime";  // what to fulfil once paid (absent ⇒ data, for old intents)
  userId: string;
  role: string;
  email: string;
  amountGhs: number;             // what we asked the buyer to pay (= order cost)
  net: string;                   // mtn | telecel | atigo
  atProduct: ProductLine | null; // data only: the product LINE (see providers/lines.ts)
  capacityGb: number;            // data only (0 for airtime)
  faceValue?: number;            // airtime only — credit to send
  pkg: string;                   // display label, e.g. "5GB · 30 days"
  recipient: string;             // local phone (0XXXXXXXXX)
  commission: number;            // reseller margin (0 for customers)
  status: "pending" | "fulfilled";
  at: number;
  fulfilledAt?: number;
  orderRef?: string;             // the order we created once paid
}

export function newOrderPayRef(userId: string): string {
  return `ORDPAY-${userId}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// The webhook uses this to route a reference to the right fulfiller.
export function isOrderPayRef(reference: string): boolean {
  return reference.startsWith("ORDPAY-");
}

// Record the payment intent. The ORDER's ref is allocated here (not at fulfilment) so the
// captured order and the payment share one id from the very start.
export async function createPendingOrderPayment(
  p: Omit<OrderPaymentDoc, "kind" | "status" | "at" | "orderRef">
): Promise<string> {
  const payments = await getPayments();
  const orderRef = await newOrderRef();
  await payments.insertOne({ ...p, orderRef, kind: "orderpay", status: "pending", at: Date.now() } as OrderPaymentDoc);
  return orderRef;
}

// Capture the ORDER ITSELF at the moment the buyer is handed off to Paystack.
//
// Before this, an order only existed once its payment was confirmed — so a buyer who paid but
// whose confirmation never reached us (closed tab, dropped callback, missed webhook) had money
// gone and nothing in their order list to point at. Now the order appears immediately as
// "pending", and the confirmed payment turns that same row into a real, paid order under the
// SAME order number (see fulfillOrderPayment). Nothing is sent to a provider until then.
export async function capturePendingOrder(reference: string): Promise<string | null> {
  const doc = await getOrderPayment(reference);
  if (!doc || !doc.orderRef) return null;
  const isAirtime = doc.product === "airtime";
  const now = Date.now();
  try {
    await createOrder({
      ref: doc.orderRef,
      userId: doc.userId,
      providerRef: null,
      // The real provider is stamped on fulfilment — nothing has been sent yet.
      provider: isAirtime ? "muviin" : "datahub",
      role: doc.role,
      type: isAirtime ? "airtime" : "data",
      net: doc.net,
      capacityGb: doc.capacityGb,
      faceValue: doc.faceValue,
      pkg: doc.pkg,
      recipient: doc.recipient,
      cost: doc.amountGhs,
      commission: doc.commission,
      status: "pending",
      refunded: false,
      at: now,
      updatedAt: now,
      pay: "Mobile money",
    });
  } catch (e: any) {
    // Capture is a safety net, never a gate on checkout — if it fails the buyer must still
    // reach Paystack, and fulfilment upserts the order anyway.
    console.error(`Order capture failed for ${reference}:`, e?.message);
    return null;
  }
  return doc.orderRef;
}

export async function getOrderPayment(reference: string): Promise<OrderPaymentDoc | null> {
  const payments = await getPayments();
  const doc = await payments.findOne({ reference });
  return doc && doc.kind === "orderpay" ? (doc as OrderPaymentDoc) : null;
}

// Fulfil a confirmed order payment — exactly once.
export async function fulfillOrderPayment(
  reference: string
): Promise<{ fulfilled: boolean; reason?: string }> {
  const payments = await getPayments();
  const doc = (await payments.findOne({ reference })) as OrderPaymentDoc | null;
  if (!doc || doc.kind !== "orderpay") return { fulfilled: false, reason: "unknown reference" };
  if (doc.status === "fulfilled") return { fulfilled: false, reason: "already fulfilled" };

  // Claim the payment: only the caller that flips pending → fulfilled places the order.
  const claim = await payments.updateOne(
    { reference, status: "pending" },
    { $set: { status: "fulfilled", fulfilledAt: Date.now() } }
  );
  if (!claim || (claim as any).matchedCount === 0) return { fulfilled: false, reason: "already fulfilled" };

  // Reuse the ref allocated at intent time so the paid order REPLACES the captured "pending"
  // row the buyer already has (same order number). Old intents predate capture → new ref.
  const orderRef = doc.orderRef || (await newOrderRef());
  const isAirtime = doc.product === "airtime";
  // Stamped immediately before the handoff, so the timeline shows when the provider actually
  // received the order — not when the row was written after it answered.
  const sentAt = Date.now();
  // Fulfil with whichever provider owns this product. Both return the same normalized
  // { ok, providerRef, status } shape from here on, so the money handling below is shared.
  const result = isAirtime
    ? await (async () => {
        const r = await sendAirtime({
          phoneNumber: doc.recipient,
          network: doc.net,
          amountGhs: doc.faceValue ?? doc.amountGhs,
          reference: orderRef,
        });
        return r.ok
          ? { ok: true as const, providerRef: r.transactionId, status: r.status }
          : { ok: false as const, error: r.error };
      })()
    : await purchaseData({
        phoneNumber: doc.recipient,
        network: doc.net,
        atProduct: doc.atProduct || undefined,
        capacityGb: doc.capacityGb,
        reference: orderRef,
      });

  if (!result.ok) {
    // A beneficiary rejection is logged for an admin to action — same as the wallet buy path,
    // so a mobile-money order that fails this way isn't invisible to the tracker.
    await captureBeneficiaryFailure({
      phoneNumber: doc.recipient,
      errorMessage: (result as any).error || "",
      orderRef,
      net: doc.net,
      userId: doc.userId,
      role: doc.role === "admin" ? "admin" : doc.role === "reseller" ? "agent" : "customer",
    });
    // Paid us, but the provider rejected it → refund the buyer to their wallet and
    // record the order as failed so it shows in their history.
    await addTx(doc.userId, {
      type: "refund",
      amount: doc.amountGhs,
      ref: orderRef,
      note: `Refund · ${doc.pkg} · ${doc.recipient} (order not placed)`,
    });
    const failed: OrderDoc = {
      ref: orderRef, userId: doc.userId, providerRef: null, provider: isAirtime ? "muviin" : (result as any).provider || "datahub",
      role: doc.role, type: isAirtime ? "airtime" : "data", net: doc.net,
      capacityGb: doc.capacityGb, faceValue: doc.faceValue, pkg: doc.pkg,
      recipient: doc.recipient, cost: doc.amountGhs, commission: doc.commission,
      status: "failed", refunded: true, at: Date.now(), updatedAt: Date.now(), sentAt,
      failedAt: Date.now(), refundedAt: Date.now(), pay: "Mobile money",
    };
    await upsertOrder(failed);
    await payments.updateOne({ reference }, { $set: { orderRef } });
    await notifyUser(doc.userId, {
      type: "order",
      title: "Order couldn't be placed — you've been refunded",
      body: `${doc.pkg} for ${doc.recipient} didn't go through. ${ghs(doc.amountGhs)} has been added to your wallet.`,
      icon: "refresh",
      link: "orders",
      ref: orderRef,
    });
    return { fulfilled: false, reason: result.error };
  }

  const order: OrderDoc = {
    ref: orderRef, userId: doc.userId, providerRef: result.providerRef, provider: isAirtime ? "muviin" : (result as any).provider || "datahub",
    role: doc.role, type: isAirtime ? "airtime" : "data", net: doc.net,
    capacityGb: doc.capacityGb, faceValue: doc.faceValue, pkg: doc.pkg,
    recipient: doc.recipient, cost: doc.amountGhs, commission: doc.commission,
    ...((result as any).cost != null ? { providerCost: (result as any).cost } : {}),
    status: result.status, refunded: false, at: Date.now(), updatedAt: Date.now(), sentAt,
    // The provider can already be past "queued" in this same reply — record the instant for
    // whichever stage it reports rather than leaving that stage with no time against it.
    ...(result.status === "processing" ? { processingAt: Date.now() } : {}),
    ...(result.status === "delivered" ? { deliveredAt: Date.now() } : {}), pay: "Mobile money",
  };
  await upsertOrder(order);
  await payments.updateOne({ reference }, { $set: { orderRef } });

  // Only text now if the provider delivered immediately; otherwise the delivery webhook
  // sends it once the order settles (see applyStatus). Best-effort.
  if (order.status === "delivered") {
    await Promise.allSettled([
      sendDeliverySms({ recipient: doc.recipient, pkg: doc.pkg, net: doc.net, ref: orderRef }),
      sendDeliveryEmail({
        userId: doc.userId, pkg: doc.pkg, net: doc.net,
        recipient: doc.recipient, ref: orderRef, cost: doc.amountGhs,
      }),
      notifyUser(doc.userId, {
        type: "order",
        title: isAirtime ? "Airtime delivered" : "Data delivered",
        body: `${doc.pkg} has been sent to ${doc.recipient}.`,
        icon: isAirtime ? "phone" : undefined,
        link: "orders",
        ref: orderRef,
      }),
      onOrderDelivered(order),
    ]);
  }

  return { fulfilled: true };
}
