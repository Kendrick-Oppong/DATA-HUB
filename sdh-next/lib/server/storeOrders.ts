// Guest storefront orders — a customer buying DATA on an agent's public /<handle> store.
// SERVER ONLY.
//
// Unlike a logged-in customer order (orders.ts), the buyer here is a guest with no wallet:
//   * They pay the AGENT's price by mobile money / card via Paystack.
//   * The platform fulfils the data through DataHub at the wholesale rate.
//   * The agent is credited their commission (sell − wholesale) into their real wallet,
//     but only once the bundle is actually DELIVERED (never on a failed sale).
//   * A delivery failure is refunded straight back to the guest's MoMo/card via Paystack
//     (there's no wallet to refund into), exactly once.
//
// Settlement is idempotent: the provider's webhook and the tracking poller can both fire, and a
// duplicate Paystack webhook can re-run fulfilment — every state change here claims a flag
// first so money moves at most once.
import { getStoreOrders, queryStoreOrders } from "./db";
import { randomRefBody, refBodyOf } from "./orders";
import { addTx } from "./wallet";
import { sendDeliverySms } from "./notify";
import { ghs, notifyAdmins, notifyUser } from "./notifications";
import { refundTransaction } from "./providers/paystack";
import { airtimeStatus } from "./providers/muviin";
import { dataOrderStatus } from "./providers/data";
import { payStoreTierBonus } from "./tierPayouts";
// Called by creditAgentOnce below. The import was missing, so every delivered store sale
// threw a ReferenceError after crediting the agent — which silently skipped the recruiter's
// override and aborted the rest of settlement (delivery SMS, sale notification).
import { payRecruitmentOverride } from "./overrides";
import type { ProductLine } from "./providers/lines";
import { isInFlight, type OrderStatus } from "@/lib/orderStatus";

export interface StoreOrderDoc {
  ref: string;                 // our id — customer-facing order number AND the provider reference
  handle: string;              // agent store handle (public URL segment)
  agentUserId: string;         // the agent (reseller) to credit
  provider: string;            // datahub | hubnet | ghdc (data) | muviin (airtime)
  providerRef: string | null;  // provider's transaction id
  type: string;                // data | airtime
  net: string;                 // mtn | telecel | atigo
  atProduct: ProductLine | null; // data only: the product LINE — MTN standard|xpress, AT ishare|bigtime
  capacityGb: number;          // data only
  faceValue?: number;          // airtime only — credit the recipient receives
  pkg: string;                 // display label, e.g. "5GB · 30 days" / "GH₵10.00 airtime"
  recipient: string;           // local phone (0XXXXXXXXX) that receives the data/credit
  payerPhone: string | null;   // the MoMo number the guest paid from (info only)
  payNetwork: string | null;   // wallet the guest paid from (info only)
  sell: number;                // what the guest paid (agent's price)
  wholesale: number;           // platform provider cost
  commission: number;          // agent margin, credited on delivery
  commissionCredited: boolean; // claim guard — agent credited at most once
  // Tier bonus (31 Jul 2026 §1): paid on the PLATFORM margin, wholesale − supplierCost.
  // Captured per order so a later vendor-price edit can't restate a settled sale.
  supplierCost?: number;       // what the platform paid the provider
  tierBonusPaid?: boolean;     // claim guard — bonus paid at most once
  tierBonusAmount?: number;
  tierBonusTier?: string;
  status: OrderStatus;         // waiting | processing | delivered | failed | refunded
  refunded: boolean;           // claim guard — guest refunded at most once
  paymentRef: string;          // Paystack reference (STOREPAY-…) — used to issue refunds
  // Server-stamped instants for each stage, so the agent's sales list and the guest's
  // tracking page show what actually happened and when.
  at: number;                  // paid / placed
  updatedAt: number;           // last status change
  sentAt?: number;             // handed to DataHub/Muviin
  processingAt?: number;       // provider reported it moved from queued to actively sending
  deliveredAt?: number;        // provider confirmed delivery
  failedAt?: number;           // provider rejected it
  refundedAt?: number;         // guest refunded to MoMo/card
  // Set when the provider reports success (or resumed processing) AFTER this sale was
  // already failed + refunded — a real delivery on top of a refund, not a display glitch.
  // applyStoreStatus() can't safely undo a Paystack refund itself, so it records the
  // conflict here and alerts an admin instead of dropping the update.
  flaggedAt?: number;
  flagNote?: string;
}

// 6–25 chars, unique — the provider echoes it back on status/webhook. "SO-K7M2XQ" is 9, well
// inside that. Short on purpose: a guest reads this number off a receipt or a WhatsApp
// message and types it into Track order. See newOrderRef() in orders.ts for the alphabet
// and the collision handling, which this shares.
export async function newStoreOrderRef(): Promise<string> {
  const c = await getStoreOrders();
  for (let i = 0; i < 8; i++) {
    const ref = "SO-" + randomRefBody();
    if (!(await c.findOne({ ref }))) return ref;
  }
  return "SO-" + randomRefBody(10);
}

export async function createStoreOrder(doc: StoreOrderDoc): Promise<void> {
  const c = await getStoreOrders();
  await c.insertOne(doc);
}

// Write a sale that may ALREADY exist as a "pending" (captured, unpaid) row — the normal case
// once a guest's Paystack payment confirms. Upserts so the paid sale replaces the captured one
// under the same order number, and so an intent from before order-capture still lands.
export async function upsertStoreOrder(doc: StoreOrderDoc): Promise<void> {
  const c = await getStoreOrders();
  await c.updateOne({ ref: doc.ref }, { $set: doc }, { upsert: true });
}

// Find a sale by the order number a customer typed. Tries the exact string first (the fast,
// indexed path that covers a clean copy-paste), then falls back to matching on the body
// alone so "k7m2xq", "K7M2XQ" and "so k7m2xq" all reach SO-K7M2XQ — people drop the prefix,
// lower-case it, and put spaces in it.
export async function getStoreOrderByRef(ref: string): Promise<StoreOrderDoc | null> {
  const c = await getStoreOrders();
  const exact = await c.findOne({ ref: String(ref || "").trim() });
  if (exact) return exact;

  const body = refBodyOf(ref);
  if (body.length < 4) return null;   // too little to identify an order — don't guess
  return c.findOne({ ref: "SO-" + body });
}

// Find a guest's sales by the number they bought FOR. Scoped to one store, newest first, and
// capped — this is a public, unauthenticated lookup, so it returns a customer's own recent
// orders on the store they're standing in and nothing wider.
export async function listStoreOrdersByRecipient(
  handle: string,
  recipient: string,
  limit = 5
): Promise<StoreOrderDoc[]> {
  const rows = await queryStoreOrders({ handle, recipient });
  return rows.sort((a, b) => b.at - a.at).slice(0, limit);
}

export async function getStoreOrderByProviderRef(providerRef: string): Promise<StoreOrderDoc | null> {
  const c = await getStoreOrders();
  return c.findOne({ providerRef });
}

export async function listStoreOrdersByAgent(agentUserId: string): Promise<StoreOrderDoc[]> {
  return queryStoreOrders({ agentUserId });
}

// Client-facing shape — mirrors the storeOrders object the storefront/agent UI renders
// (see components/store.tsx placeStoreOrder + store-orders.tsx).
export function publicStoreOrder(o: StoreOrderDoc) {
  return {
    id: o.ref,
    net: o.net,
    pkg: o.pkg,
    price: o.sell,
    cost: o.wholesale,
    commission: o.commission,
    customer: o.recipient,
    customerName: "Storefront customer",
    status: o.status,
    at: o.at,
    updatedAt: o.updatedAt || o.at,
    sentAt: o.sentAt || null,
    processingAt: o.processingAt || null,
    deliveredAt: o.deliveredAt || null,
    failedAt: o.failedAt || null,
    refundedAt: o.refundedAt || null,
    pay: (o.payNetwork ? o.payNetwork.toUpperCase() : "Mobile money") + " MoMo",
    via: "direct",
  };
}

async function patch(ref: string, set: Record<string, any>): Promise<void> {
  const c = await getStoreOrders();
  await c.updateOne({ ref }, { $set: { ...set, updatedAt: Date.now() } });
}

// Stamp extra fields on a store order (used by the payment fulfiller to record refund times).
export async function patchStoreOrder(ref: string, set: Record<string, any>): Promise<void> {
  return patch(ref, set);
}

// Credit the agent their commission — exactly once, only for a delivered order.
async function creditAgentOnce(order: StoreOrderDoc): Promise<void> {
  if (order.commissionCredited || order.commission <= 0) return;
  const c = await getStoreOrders();
  // Claim the credit so concurrent settlements (webhook + poller) can't double-pay.
  const claim = await c.updateOne(
    { ref: order.ref, commissionCredited: { $ne: true } },
    { $set: { commissionCredited: true } }
  );
  if (!claim || (claim as any).matchedCount === 0) return;
  await addTx(order.agentUserId, {
    type: "commission",
    amount: order.commission,
    ref: order.ref,
    note: `Store sale · ${order.pkg} · ${order.recipient}`,
  });
  // §4: whoever recruited this agent earns an override on the commission they just made.
  await payRecruitmentOverride(order.agentUserId, order.commission, order.ref);
}

// Called when an order reaches (or is created already at) "delivered": credit the agent
// and text the recipient. Safe to call more than once.
export async function settleDelivered(order: StoreOrderDoc): Promise<void> {
  await creditAgentOnce(order);
  // §1: the tier bonus is paid on a store sale exactly as on a manual buy — same platform
  // margin, unaffected by whatever the agent charged the guest. Best-effort: the agent's own
  // commission above must never be blocked by a problem paying the bonus.
  try { await payStoreTierBonus(order); } catch (e: any) { console.error("Store tier bonus error:", e?.message); }
  await sendDeliverySms({ recipient: order.recipient, pkg: order.pkg, net: order.net, ref: order.ref });
  await notifyUser(order.agentUserId, {
    type: "sale",
    title: "New sale on your store",
    body: `${order.pkg} was delivered to ${order.recipient}. You earned ${ghs(order.commission)} on ${ghs(order.sell)}.`,
    link: "store-orders",
    ref: order.ref,
  });
}

// Refund the guest's payment back to their MoMo/card — at most once.
async function refundGuestOnce(order: StoreOrderDoc, reason: string): Promise<void> {
  const c = await getStoreOrders();
  const claim = await c.updateOne(
    { ref: order.ref, refunded: { $ne: true } },
    { $set: { refunded: true } }
  );
  if (!claim || (claim as any).matchedCount === 0) return; // already refunded
  const r = await refundTransaction(order.paymentRef, order.sell);
  if (!r.ok) console.error(`Store order ${order.ref} refund failed (${reason}):`, r.error);
  else await c.updateOne({ ref: order.ref }, { $set: { refundedAt: Date.now() } });
  await notifyUser(order.agentUserId, {
    type: "sale",
    title: "A store order couldn't be delivered",
    body: `${order.pkg} for ${order.recipient} failed. Your customer has been refunded ${ghs(order.sell)} to their mobile money.`,
    icon: "refresh",
    link: "store-orders",
    ref: order.ref,
  });
}

// Raise the flag exactly once per sale — providers retry webhooks and the reconcile sweep
// can also re-poll a settled order, so this must not spam admins on every repeat.
async function flagPostFailureConflict(order: StoreOrderDoc, providerStatus: OrderStatus): Promise<void> {
  if (order.flaggedAt) return;
  const note = `Provider reported "${providerStatus}" after this sale was already failed and the guest refunded ${ghs(order.sell)}.`;
  await patch(order.ref, { flaggedAt: Date.now(), flagNote: note });
  await notifyAdmins({
    type: "order",
    title: "Refunded store sale later delivered by provider",
    body: `${order.pkg} for ${order.recipient} (${order.ref}, ${order.handle}) — ${note}`,
    icon: "flag",
    link: "orders",
    ref: order.ref,
  });
}

// Apply a status transition from the provider (webhook or poller). Idempotent: a delivered order
// won't re-credit, a failed order refunds the guest once.
export async function applyStoreStatus(
  ref: string,
  status: OrderStatus
): Promise<{ changed: boolean; order: StoreOrderDoc | null }> {
  const order = await getStoreOrderByRef(ref);
  if (!order) return { changed: false, order: null };

  // A provider that now reports the bundle went out (or resumed sending) after we already
  // refunded the guest means the data was delivered on top of the refund — a straight loss.
  // Flag it for manual reconciliation instead of silently dropping it (which is how these
  // slipped through before); don't re-run settlement (agent commission/tier bonus), since
  // this was never a real sale once refunded.
  if (order.status === "failed" && (status === "delivered" || status === "processing")) {
    await flagPostFailureConflict(order, status);
    return { changed: false, order };
  }

  // Only an in-flight order transitions. "pending" (captured, payment unconfirmed) is not
  // with any provider yet, and delivered/failed/refunded are terminal — so repeat callbacks
  // are ignored (no double-credit, no double-refund).
  if (!isInFlight(order.status)) return { changed: false, order };
  if (order.status === status) return { changed: false, order };

  // Forward-only: "waiting" is also what a provider poll reports when it has nothing new,
  // so it must never pull an order that has already started sending back to the queue.
  if (status === "waiting") return { changed: false, order };

  // waiting → processing: the provider has started sending. Stage change only — no money
  // moves, no commission is credited — so stamp it and leave the sale in flight.
  if (status === "processing") {
    // First time only: a provider reports "in progress" on repeated polls, and the timeline
    // must show when sending STARTED, not when we last heard about it.
    const processingAt = order.processingAt || Date.now();
    await patch(ref, { status: "processing", processingAt });
    return { changed: true, order: { ...order, status: "processing", processingAt } };
  }

  if (status === "delivered") {
    const deliveredAt = Date.now();
    await patch(ref, { status: "delivered", deliveredAt });
    await settleDelivered({ ...order, status: "delivered", deliveredAt });
    return { changed: true, order: { ...order, status: "delivered", deliveredAt } };
  }

  if (status === "failed" || status === "refunded") {
    const failedAt = Date.now();
    await patch(ref, { status: "failed", failedAt });
    await refundGuestOnce(order, status);
    return { changed: true, order: { ...order, status: "failed", refunded: true, failedAt } };
  }

  return { changed: false, order }; // unknown → keep in flight
}

// Settlement backstop for storefront sales. Only some providers push a delivery webhook —
// GHDataConnect's is optional and Muviin has none — so a sale otherwise only settles when
// something asks. Guest tracking does it while the customer watches; this catches the rest
// when the agent opens their sales or an admin opens the monitor, so a commission still
// lands (or the guest is refunded) even if nobody stayed on the tracking page.
//
// Routes by the provider stored on the order, and is bounded so a long sales history can't
// turn one page load into dozens of provider calls.
const RECONCILE_LIMIT = 12;
export async function reconcileStoreAirtime(orders: StoreOrderDoc[]): Promise<StoreOrderDoc[]> {
  const pending = orders.filter((o) => isInFlight(o.status)).slice(0, RECONCILE_LIMIT);
  if (!pending.length) return orders;

  const settled = new Map<string, StoreOrderDoc>();
  await Promise.all(
    pending.map(async (o) => {
      try {
        const st = o.provider === "muviin"
          ? await airtimeStatus(o.ref)
          : await dataOrderStatus(o.ref, o.provider, o.net);
        if (!st.ok) return;
        // applyStoreStatus is the single authority on what counts as a real transition.
        const res = await applyStoreStatus(o.ref, st.status);
        if (res.changed && res.order) settled.set(o.ref, res.order);
      } catch {}
    })
  );
  return settled.size ? orders.map((o) => settled.get(o.ref) || o) : orders;
}
