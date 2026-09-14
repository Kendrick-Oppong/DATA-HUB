// Order lifecycle: create → (provider) → delivered | failed(+refund). SERVER ONLY.
import { getOrders, queryOrders } from "./db";
import { addTx } from "./wallet";
import { sendDeliveryEmail, sendDeliverySms } from "./notify";
import { ghs, notifyAdmins, notifyUser } from "./notifications";
import { airtimeStatus } from "./providers/muviin";
import { dataOrderStatus } from "./providers/data";
import { qualifyReferral } from "./referrals";
import { payTierBonus } from "./tierPayouts";
import { isInFlight, type OrderStatus } from "@/lib/orderStatus";

export interface OrderDoc {
  ref: string;          // our id — the customer-facing order number and wallet correlation key
  userId: string;
  providerRef: string | null;
  provider: string;     // "datahub" (data) | "muviin" (airtime); "hubnet"/"ghdc" on pre-switch orders
  role: string;         // customer | reseller
  type: string;         // "data" | "airtime"
  net: string;          // mtn | telecel | atigo
  capacityGb: number;   // data only (0 for airtime)
  faceValue?: number;   // airtime only — credit sent to the recipient
  pkg: string;          // human label, e.g. "5GB · 30 days" / "GH₵10.00 airtime"
  recipient: string;    // phone number
  cost: number;         // charged to the SDH wallet
  providerCost?: number; // what the upstream provider charged US, when it reports it
  // What the platform pays the provider for this bundle, captured at purchase from the admin
  // vendor catalog. The TIER BONUS base is `wholesale − supplierCost` (see tiers.ts), so it
  // must be stored per order: an admin editing the catalog later must not retroactively
  // change what a delivered order was worth.
  supplierCost?: number;
  wholesale?: number;   // what the agent paid us (= cost on a reseller order); for the same reason
  commission: number;   // reseller commission, credited on delivery
  status: OrderStatus;  // pending | waiting | processing | delivered | failed | refunded
  refunded: boolean;
  tierBonusPaid?: boolean;   // claim guard — the §1 tier bonus is paid at most once
  tierBonusAmount?: number;  // what was paid, for the receipt / audit
  tierBonusTier?: string;
  // All times are epoch ms stamped by the SERVER at the moment the event happened, so the
  // order history, receipt and tracking timeline all show real instants (never estimates).
  at: number;           // placed
  updatedAt: number;    // last status change
  // The three provider milestones, each stamped when it actually happened:
  sentAt?: number;      // we handed the order to DataHub/Muviin
  processingAt?: number;// the provider reported it moved from queued to actively sending
  deliveredAt?: number; // provider confirmed delivery
  failedAt?: number;    // provider rejected it
  refundedAt?: number;  // money returned to the wallet
  pay?: string;         // how it was paid — "Wallet" (default) | "Mobile money"
  // Set when the provider reports success (or resumed processing) AFTER this order was
  // already failed + refunded — a real delivery on top of a refund, not a display glitch.
  // applyStatus() can't safely undo the refund itself (the wallet may already be spent), so
  // it records the conflict here and alerts an admin instead of dropping the update.
  flaggedAt?: number;
  flagNote?: string;
}

// ---- Customer-facing order numbers ----
// Short enough to read down a phone line or type into Track order: "ORD-K7M2XQ" (10 chars)
// rather than the old "ORD-1755264000000-4821" (22). Existing long refs stay valid — nothing
// looks up by format, only by exact value.
//
// The alphabet drops 0/O/1/I/L, the characters people misread off a receipt or mishear when
// an order number is read out. Six of the remaining 31 is ~887 million combinations: plenty
// for any one ref, but not enough to wave off birthday collisions across a growing table, so
// each candidate is checked before it's handed out. The unique index on `ref` is the actual
// guarantee — this just avoids ever hitting it.
//
// The "ORD-"/"SO-" prefixes are load-bearing: components/store.tsx and order-tracking.tsx
// both tell an app order from a store sale by prefix alone.
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function randomRefBody(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  return out;
}

// Normalize whatever a customer typed into a ref we can match: upper-cased, with the
// separators and any prefix they may or may not have included stripped back to the body.
// "so-k7m2xq", "K7M2XQ" and "SO K7M2XQ" all have to find the same order.
//
// Stripping the prefix can't eat part of a real body: "O" isn't in REF_ALPHABET, so no body
// ever begins "SO" or "ORD".
export function refBodyOf(raw: string): string {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(?:ORD|SO)/, "");
}

export async function newOrderRef(): Promise<string> {
  const orders = await getOrders();
  for (let i = 0; i < 8; i++) {
    const ref = "ORD-" + randomRefBody();
    if (!(await orders.findOne({ ref }))) return ref;
  }
  // Eight straight collisions means something is badly wrong (or the table has grown far
  // beyond what 6 chars comfortably holds) — widen rather than risk a duplicate.
  return "ORD-" + randomRefBody(10);
}

export async function createOrder(doc: OrderDoc): Promise<void> {
  const orders = await getOrders();
  await orders.insertOne(doc);
}

// Write an order that may ALREADY exist as a "pending" (captured, unpaid) row — the normal
// case once a Paystack payment confirms. Upserts so the paid order replaces the captured one
// under the same ref (the customer keeps the order number they were shown), and so an intent
// created before order-capture existed still lands.
export async function upsertOrder(doc: OrderDoc): Promise<void> {
  const orders = await getOrders();
  await orders.updateOne({ ref: doc.ref }, { $set: doc }, { upsert: true });
}

export async function getOrderByRef(ref: string): Promise<OrderDoc | null> {
  const orders = await getOrders();
  return orders.findOne({ ref });
}

export async function getOrderByProviderRef(providerRef: string): Promise<OrderDoc | null> {
  const orders = await getOrders();
  return orders.findOne({ providerRef });
}

export async function listOrders(userId: string): Promise<OrderDoc[]> {
  return queryOrders({ userId });
}

// Client-facing shape (mirrors the demo order object the UI already renders).
export function publicOrder(o: OrderDoc) {
  return {
    id: o.ref,
    net: o.net,
    type: o.type,
    faceValue: o.faceValue ?? null,
    pkg: o.pkg,
    recipient: o.recipient,
    cost: o.cost,
    commission: o.commission,
    status: o.status,
    at: o.at,
    updatedAt: o.updatedAt || o.at,
    sentAt: o.sentAt || null,
    processingAt: o.processingAt || null,
    deliveredAt: o.deliveredAt || null,
    failedAt: o.failedAt || null,
    refundedAt: o.refundedAt || null,
    pay: o.pay || "Wallet",
  };
}

async function patch(ref: string, set: Record<string, any>): Promise<void> {
  const orders = await getOrders();
  await orders.updateOne({ ref }, { $set: { ...set, updatedAt: Date.now() } });
}

// Raise the flag exactly once per order — DataHub retries webhooks 3x and the reconcile
// sweep can also re-poll a settled order, so this must not spam admins on every repeat.
async function flagPostFailureConflict(order: OrderDoc, providerStatus: OrderStatus): Promise<void> {
  if (order.flaggedAt) return;
  const note = `Provider reported "${providerStatus}" after this order was already failed and refunded ${ghs(order.cost)}.`;
  await patch(order.ref, { flaggedAt: Date.now(), flagNote: note });
  await notifyAdmins({
    type: "order",
    title: "Refunded order later delivered by provider",
    body: `${order.pkg} for ${order.recipient} (${order.ref}) — ${note}`,
    icon: "flag",
    link: "orders",
    ref: order.ref,
  });
}

// Apply a terminal (or in-flight) status transition. Idempotent: a delivered/failed
// order won't be re-processed, and a refund is issued at most once.
export async function applyStatus(
  ref: string,
  status: OrderStatus
): Promise<{ changed: boolean; order: OrderDoc | null }> {
  const order = await getOrderByRef(ref);
  if (!order) return { changed: false, order: null };

  // Captured but unpaid: no provider holds this order yet, so no callback or poll may move
  // it. It leaves "pending" only when its payment is confirmed (see orderPayments.ts).
  if (order.status === "pending") return { changed: false, order };

  // Already settled → ignore repeat callbacks.
  if (order.status === "delivered" || order.status === "refunded") return { changed: false, order };
  if (order.status === "failed") {
    // A provider that now reports the bundle went out (or resumed sending) after we already
    // refunded it means the data was delivered on top of the refund — a straight loss, and
    // exactly the case that used to vanish here silently. Flag it for manual reconciliation
    // instead of dropping it; don't re-run delivery settlement (SMS/tier bonus/referral),
    // since this was never a real sale once refunded.
    if (status === "delivered" || status === "processing") await flagPostFailureConflict(order, status);
    return { changed: false, order };
  }
  if (order.status === status) return { changed: false, order };

  // An order only ever moves FORWARD through waiting → processing → settled. "waiting" is
  // also what a provider poll reports when it has no new information, so it must never pull
  // an order that has already started sending back to the queue.
  if (status === "waiting") return { changed: false, order };

  // waiting → processing: the provider has started sending. A stage change only — no money
  // moves and nothing is notified — so stamp it and leave the order in flight.
  if (status === "processing") {
    // First time only: a provider can report "in progress" on several polls, and the
    // timeline must show when sending STARTED, not when we last heard about it.
    const processingAt = order.processingAt || Date.now();
    await patch(ref, { status: "processing", processingAt });
    return { changed: true, order: { ...order, status: "processing", processingAt } };
  }

  if (status === "delivered") {
    const deliveredAt = Date.now();
    const isAirtime = order.type === "airtime";
    await patch(ref, { status: "delivered", deliveredAt });
    // Now that the provider has confirmed delivery: text the recipient, email the buyer a
    // receipt, and settle the in-app notification and earnings. All best-effort and
    // independent of each other, so they run together rather than in a slow chain.
    await Promise.allSettled([
      sendDeliverySms({ recipient: order.recipient, pkg: order.pkg, net: order.net, ref: order.ref }),
      sendDeliveryEmail({
        userId: order.userId, pkg: order.pkg, net: order.net,
        recipient: order.recipient, ref: order.ref, cost: order.cost,
      }),
      notifyUser(order.userId, {
        type: "order",
        title: isAirtime ? "Airtime delivered" : "Data delivered",
        body: `${order.pkg} has been sent to ${order.recipient}.`,
        ...(isAirtime ? { icon: "phone" } : {}),
        link: "orders",
        ref: order.ref,
      }),
      onOrderDelivered({ ...order, status: "delivered", deliveredAt }),
    ]);
    return { changed: true, order: { ...order, status: "delivered", deliveredAt } };
  }

  if (status === "failed" || status === "refunded") {
    const failedAt = Date.now();
    // Refund the customer's wallet exactly once, then mark the order.
    let refundedAt: number | undefined;
    if (!order.refunded && order.cost > 0) {
      await addTx(order.userId, {
        type: "refund",
        amount: order.cost,
        ref: order.ref,
        note: `Refund · ${order.pkg} · ${order.recipient} (delivery failed)`,
      });
      refundedAt = Date.now();
    }
    await patch(ref, { status: "failed", refunded: true, failedAt, ...(refundedAt ? { refundedAt } : {}) });
    await notifyUser(order.userId, {
      type: "order",
      title: "Order failed — you've been refunded",
      body: `${order.pkg} for ${order.recipient} couldn't be delivered. ${ghs(order.cost)} is back in your wallet.`,
      icon: "refresh",
      link: "orders",
      ref: order.ref,
    });
    return { changed: true, order: { ...order, status: "failed", refunded: true, failedAt, refundedAt } };
  }

  // unknown → keep in flight
  return { changed: false, order };
}

// Everything that has to happen when an order is confirmed DELIVERED, in one place so no
// fulfilment path can forget one:
//   * the reseller's tier bonus, calculated on the order's MARGIN (incentive spec §1)
//   * the buyer's referral, which qualifies on their FIRST DELIVERED ORDER (spec §3)
// Both are best-effort — neither can fail a delivery that has already happened.
export async function onOrderDelivered(order: OrderDoc): Promise<void> {
  try { await payTierBonus(order); } catch (e: any) { console.error("Tier bonus error:", e?.message); }
  try { await qualifyReferral(order.userId); } catch (e: any) { console.error("Referral qualify error:", e?.message); }
}

// Settle orders that are still in flight (waiting OR processing).
//
// Neither Muviin nor GHDataConnect calls us back, so an order only leaves flight when
// something asks. The buy screen polls for ~18s and the order-detail page asks on open, but
// anything slower than that used to sit in flight forever — this is what settles the
// rest whenever a list of orders is loaded (the buyer's Orders page, or the admin monitor).
// It also advances waiting → processing, which is how a GHDataConnect order (no webhook)
// ever shows as "Processing" rather than jumping straight from Waiting to Delivered.
//
// Routes by the provider stored on the order: airtime to Muviin, data to whichever provider
// took it. Bounded so a long history can't turn one page load into dozens of provider calls.
const RECONCILE_LIMIT = 12;
export async function reconcilePending(orders: OrderDoc[]): Promise<OrderDoc[]> {
  const pending = orders.filter((o) => isInFlight(o.status)).slice(0, RECONCILE_LIMIT);
  if (!pending.length) return orders;

  const settled = new Map<string, OrderDoc>();
  await Promise.all(
    pending.map(async (o) => {
      try {
        const st = o.provider === "muviin"
          ? await airtimeStatus(o.ref)
          : await dataOrderStatus(o.ref, o.provider, o.net);
        if (!st.ok) return;
        // applyStatus is the single authority on what's a real transition — it ignores
        // repeats, backwards moves and no-information polls.
        const res = await applyStatus(o.ref, st.status);
        if (res.changed && res.order) settled.set(o.ref, res.order);
      } catch {}
    })
  );
  return settled.size ? orders.map((o) => settled.get(o.ref) || o) : orders;
}

// Kept for callers that only ever hold airtime.
export const reconcileAirtime = reconcilePending;
