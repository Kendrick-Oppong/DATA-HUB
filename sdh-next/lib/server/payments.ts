// Wallet top-up payments. SERVER ONLY.
// A payment doc is created "pending" when a top-up is initialized, then flipped to
// "applied" exactly once when Paystack confirms it — at which point the wallet is
// credited. The claim (pending → applied) guards against duplicate webhook/callback
// crediting; addTx itself has no dedup, so this is where idempotency lives.
import { getPayments } from "./db";
import { addTx } from "./wallet";
import { ghs, notifyUser } from "./notifications";

export interface PaymentDoc {
  reference: string;              // Paystack reference — the idempotency key
  userId: string;
  amountGhs: number;              // amount we asked the user to pay
  email: string;
  status: "pending" | "applied";
  at: number;
  appliedAt?: number;
  creditedGhs?: number;           // amount actually credited (from Paystack)
}

export function newTopupRef(userId: string): string {
  return `TOPUP-${userId}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createPendingTopup(p: {
  reference: string;
  userId: string;
  amountGhs: number;
  email: string;
}): Promise<void> {
  const payments = await getPayments();
  await payments.insertOne({
    reference: p.reference,
    userId: p.userId,
    amountGhs: p.amountGhs,
    email: p.email,
    status: "pending",
    at: Date.now(),
  } as PaymentDoc);
}

export async function getPayment(reference: string): Promise<PaymentDoc | null> {
  const payments = await getPayments();
  return payments.findOne({ reference });
}

// Credit a confirmed top-up to the user's wallet — exactly once.
// `gatewayAmountGhs` is the amount Paystack says was actually paid; we credit that
// (not the requested amount) so the ledger always matches real money received.
export async function creditTopup(
  reference: string,
  gatewayAmountGhs: number
): Promise<{ credited: boolean; reason?: string }> {
  const payments = await getPayments();
  const doc: PaymentDoc | null = await payments.findOne({ reference });
  if (!doc) return { credited: false, reason: "unknown reference" };
  if (doc.status === "applied") return { credited: false, reason: "already applied" };

  // Claim the payment: only the caller that flips pending → applied proceeds to credit.
  const claim = await payments.updateOne(
    { reference, status: "pending" },
    { $set: { status: "applied", appliedAt: Date.now(), creditedGhs: gatewayAmountGhs } }
  );
  if (!claim || (claim as any).matchedCount === 0) return { credited: false, reason: "already applied" };

  const res = await addTx(doc.userId, {
    type: "topup",
    amount: gatewayAmountGhs,
    ref: reference,
    note: "Wallet top-up · Paystack",
  });
  if (!res.ok) {
    // Crediting failed after we claimed it — roll the claim back so it can be retried.
    await payments.updateOne(
      { reference },
      { $set: { status: "pending" }, $unset: { appliedAt: "", creditedGhs: "" } }
    );
    return { credited: false, reason: res.error };
  }
  await notifyUser(doc.userId, {
    type: "wallet",
    title: "Wallet funded",
    body: `${ghs(gatewayAmountGhs)} has been added to your wallet.`,
    link: "wallet",
    ref: reference,
  });
  // NOTE: funding the wallet no longer qualifies a referral. Per the incentive spec §3 the
  // trigger is the referred person's first DELIVERED order — see qualifyReferral's call
  // sites in orders.ts / orderPayments.ts.
  return { credited: true };
}
