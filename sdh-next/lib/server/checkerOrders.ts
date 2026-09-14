// Result-checker voucher orders (WASSCE / BECE via DataHub). SERVER ONLY.
//
// Flow: buyer pays (wallet) → we purchase the voucher from DataHub (/voucher-purchase),
// which is SYNCHRONOUS and returns the PIN + serial in the same response, so the order is
// created already "delivered" and the buyer is texted immediately (see app/api/checkers).
// A DataHub rejection auto-refunds the buyer before the order is ever created.
//
// Older orders placed through Muviin (kept here for history) worked differently: Muviin's
// BuyChecker did NOT return the PIN + serial, so those landed "processing" and an admin had
// to read the voucher off Muviin's portal and attach it via fulfillCheckerOrder below.
import { getCheckerOrders, queryCheckerOrders } from "./db";
import { addTx } from "./wallet";
import { payRecruitmentOverride } from "./overrides";
import { sendCheckerSms } from "./notify";
import { ghs, notifyUser } from "./notifications";

export type CheckerOrderStatus = "processing" | "delivered" | "failed" | "refunded";

export interface CheckerOrderDoc {
  ref: string;                 // CHK-… (our id + Muviin extRef + customer-facing order number)
  userId: string;
  role: string;                // customer | reseller
  provider: "datahub" | "muviin"; // muviin only exists on orders placed before the switch
  productId: string;           // wassce | bece
  productName: string;         // "WASSCE Checker"
  qty: number;                 // vouchers requested (usually 1)
  recipient: string;           // phone that receives the PIN by SMS (local 0XXXXXXXXX)
  cost: number;                // charged to the buyer's wallet
  commission: number;          // reseller margin, credited on delivery
  batchRef: string | null;     // Muviin batch reference
  status: CheckerOrderStatus;
  pin: string | null;          // filled by admin from the Muviin portal
  serial: string | null;
  refunded: boolean;
  commissionCredited: boolean;
  at: number;                  // placed
  updatedAt: number;           // last status change
  deliveredAt?: number;        // admin attached the PIN + serial
  failedAt?: number;           // rejected / declined
  refundedAt?: number;         // money returned to the wallet
}

export function newCheckerRef(): string {
  return "CHK-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

export async function createCheckerOrder(doc: CheckerOrderDoc): Promise<void> {
  const c = await getCheckerOrders();
  await c.insertOne(doc);
}
export async function getCheckerOrderByRef(ref: string): Promise<CheckerOrderDoc | null> {
  const c = await getCheckerOrders();
  return c.findOne({ ref });
}
export async function listCheckerOrdersByUser(userId: string): Promise<CheckerOrderDoc[]> {
  return queryCheckerOrders({ userId });
}
export async function listAllCheckerOrders(): Promise<CheckerOrderDoc[]> {
  return queryCheckerOrders({});
}

// Client-facing shape.
export function publicCheckerOrder(o: CheckerOrderDoc) {
  return {
    id: o.ref,
    productId: o.productId,
    product: o.productName,
    qty: o.qty,
    recipient: o.recipient,
    cost: o.cost,
    commission: o.commission,
    status: o.status,
    pin: o.pin || null,
    serial: o.serial || null,
    at: o.at,
    updatedAt: o.updatedAt || o.at,
    deliveredAt: o.deliveredAt || null,
    failedAt: o.failedAt || null,
    refundedAt: o.refundedAt || null,
    userId: o.userId,
  };
}

async function patch(ref: string, set: Record<string, any>): Promise<void> {
  const c = await getCheckerOrders();
  await c.updateOne({ ref }, { $set: { ...set, updatedAt: Date.now() } });
}

async function creditCommission(order: CheckerOrderDoc): Promise<void> {
  if (order.commissionCredited || order.commission <= 0) return;
  const c = await getCheckerOrders();
  const claim = await c.updateOne({ ref: order.ref, commissionCredited: { $ne: true } }, { $set: { commissionCredited: true } });
  if (!claim || (claim as any).matchedCount === 0) return;
  await addTx(order.userId, { type: "commission", amount: order.commission, ref: order.ref, note: `Checker sale · ${order.productName} · ${order.recipient}` });
  // §4: the recruiter's override on their recruit's commission.
  await payRecruitmentOverride(order.userId, order.commission, order.ref);
}

// Everything that happens once an order reaches "delivered" — commission, SMS, in-app
// notice — in one place so it can't be forgotten on either path that reaches "delivered":
// the DataHub purchase route (synchronous, order created already delivered) and
// fulfillCheckerOrder below (legacy Muviin orders, delivered later by an admin).
export async function settleDeliveredChecker(order: CheckerOrderDoc): Promise<void> {
  await creditCommission(order);
  await sendCheckerSms({ recipient: order.recipient, product: order.productName, pin: order.pin || "", serial: order.serial || "", ref: order.ref });
  await notifyUser(order.userId, {
    type: "order",
    title: `Your ${order.productName} is ready`,
    body: `The serial and PIN were sent to ${order.recipient} by SMS — you can also see them under Orders.`,
    icon: "ticket",
    link: "orders",
    ref: order.ref,
  });
}

// Legacy Muviin path: admin attaches the PIN + serial read off Muviin's portal → deliver.
export async function fulfillCheckerOrder(
  ref: string,
  pin: string,
  serial: string
): Promise<{ ok: true; order: CheckerOrderDoc } | { ok: false; error: string }> {
  const order = await getCheckerOrderByRef(ref);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === "delivered") return { ok: true, order };
  if (order.status === "failed" || order.status === "refunded") return { ok: false, error: "That order was refunded — it can't be delivered." };
  if (!pin.trim() || !serial.trim()) return { ok: false, error: "Enter both the serial and the PIN." };

  const now = Date.now();
  await patch(ref, { pin: pin.trim(), serial: serial.trim(), status: "delivered", deliveredAt: now });
  const delivered = { ...order, pin: pin.trim(), serial: serial.trim(), status: "delivered" as const, deliveredAt: now };
  await settleDeliveredChecker(delivered);
  return { ok: true, order: delivered };
}

// Refund a checker order (Muviin rejected, or admin declines) — wallet refund, once.
export async function refundCheckerOrder(ref: string, reason = "not fulfilled"): Promise<void> {
  const order = await getCheckerOrderByRef(ref);
  if (!order || order.refunded) return;
  const c = await getCheckerOrders();
  const now = Date.now();
  const claim = await c.updateOne({ ref, refunded: { $ne: true } }, { $set: { refunded: true, status: "failed", failedAt: now, updatedAt: now } });
  if (!claim || (claim as any).matchedCount === 0) return;
  if (order.cost > 0) {
    await addTx(order.userId, { type: "refund", amount: order.cost, ref, note: `Refund · ${order.productName} (${reason})` });
    await patch(ref, { refundedAt: Date.now() });
  }
  await notifyUser(order.userId, {
    type: "order",
    title: `${order.productName} refunded`,
    body: `Your ${order.productName} order couldn't be fulfilled (${reason}). ${ghs(order.cost)} is back in your wallet.`,
    icon: "refresh",
    link: "orders",
    ref,
  });
}
