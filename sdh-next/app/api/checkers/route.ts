import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { normalizeGhPhone } from "@/lib/server/phone";
import { refundSpend, spend } from "@/lib/server/wallet";
import { priceChecker } from "@/lib/server/checkerPricing";
import { priceMismatch } from "@/lib/server/pricing";
import { voucherPurchase } from "@/lib/server/providers/datahub";
import {
  newCheckerRef,
  createCheckerOrder,
  listCheckerOrdersByUser,
  publicCheckerOrder,
  settleDeliveredChecker,
  CheckerOrderDoc,
} from "@/lib/server/checkerOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the signed-in user's result-checker orders.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const list = await listCheckerOrdersByUser(s.uid);
  return NextResponse.json({ orders: list.map(publicCheckerOrder) });
}

// Buy a result-checker voucher: debit the wallet → purchase it from DataHub → persist.
// DataHub's /voucher-purchase is synchronous — the PIN + serial come back in the same call,
// so the order is created already "delivered" (no admin fulfilment step). A rejection
// refunds the wallet immediately so the buyer is never charged for a voucher that didn't go
// out — same money guarantee as data/airtime purchases (see app/api/orders/route.ts).
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const productId = String(b.productId || "");
  const phone = normalizeGhPhone(String(b.recipient || ""));
  const priced = await priceChecker(productId, Number(b.qty || 1), s.role);

  if (!priced) return NextResponse.json({ error: "That checker isn't available." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Enter a valid phone number to receive the PIN." }, { status: 400 });

  // Refuse to debit the wallet for a total the buy screen didn't show. Checked before
  // spend() so a mismatch costs the buyer nothing.
  const mismatch = priceMismatch(b.expectedCost, priced.cost);
  if (mismatch) return NextResponse.json({ error: mismatch, cost: priced.cost }, { status: 409 });

  const ref = newCheckerRef();
  // Debit the wallet (authoritative overdraft check). Referral credit is spent before cash.
  const debit = await spend(s.uid, {
    amount: priced.cost,
    ref,
    note: `${priced.name}${priced.qty > 1 ? " ×" + priced.qty : ""} · ${phone.local}`,
  });
  if (!debit.ok) return NextResponse.json({ error: debit.error || "Insufficient wallet balance." }, { status: 400 });

  const result = await voucherPurchase({ productId, recipient: phone.local, quantity: priced.qty });
  if (!result.ok) {
    await refundSpend(s.uid, {
      cash: debit.paidFromCash,
      credit: debit.paidFromCredit,
      ref,
      note: `Refund · ${priced.name} (not delivered)`,
    });
    return NextResponse.json(
      { error: result.error || "Could not deliver the voucher. You were not charged." },
      { status: 502 }
    );
  }

  // Multiple vouchers (qty > 1) join into one serial/pin string — checker orders are almost
  // always qty 1, and the SMS + admin desk already show a single field per order.
  const now = Date.now();
  const order: CheckerOrderDoc = {
    ref, userId: s.uid, role: s.role, provider: "datahub",
    productId, productName: priced.name, qty: priced.qty, recipient: phone.local,
    cost: priced.cost, commission: priced.commission, batchRef: null,
    status: "delivered",
    pin: result.vouchers.map((v) => v.pin).join(", "),
    serial: result.vouchers.map((v) => v.serial).join(", "),
    refunded: false, commissionCredited: false,
    at: now, updatedAt: now, deliveredAt: now,
  };
  await createCheckerOrder(order);
  await settleDeliveredChecker(order);
  return NextResponse.json({ order: publicCheckerOrder(order) });
}
