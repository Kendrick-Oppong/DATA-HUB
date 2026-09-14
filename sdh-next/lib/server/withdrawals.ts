// Agent wallet withdrawals — cash out real wallet balance to mobile money via Paystack
// Transfers. SERVER ONLY.
//
// Flow (all server-side, idempotent):
//   1. Debit the wallet for the amount (addTx rejects overdrafts — the balance can't go
//      negative and can't be double-spent).
//   2. Record a withdrawal doc as "processing".
//   3. Register the payout MoMo number with Paystack and initiate a transfer from the
//      Paystack balance. If either step fails, the wallet is refunded immediately.
//   4. Paystack settles the transfer asynchronously → the transfer.* webhook flips the
//      withdrawal to "paid", or refunds the wallet on failure/reversal.
//
// Money only ever leaves the wallet once, and a failed payout is always refunded exactly
// once (claim guard on `refunded`).
import { getWithdrawals, queryWithdrawals } from "./db";
import { addTx } from "./wallet";
import { ghs, notifyAdmins, notifyUser } from "./notifications";
import { createTransferRecipient, initiateTransfer, paystackMode } from "./providers/paystack";

export const MIN_WITHDRAW = 10;
export const MAX_WITHDRAW = 10000;

export interface WithdrawalDoc {
  reference: string;                 // our idempotency key (WD-…)
  userId: string;
  amountGhs: number;
  momo: { number: string; network: string; name: string };
  // requested → agent asked, wallet already debited, awaiting admin action.
  // processing → admin sent it via Paystack, awaiting settlement.
  // paid → completed (Paystack settled, or admin marked a manual payout paid).
  // rejected → admin declined, wallet refunded.  failed → Paystack transfer failed, refunded.
  status: "requested" | "processing" | "paid" | "failed" | "rejected";
  recipientCode?: string;            // Paystack transfer recipient
  transferCode?: string;             // Paystack transfer
  failureReason?: string;
  refunded?: boolean;
  at: number;
  updatedAt: number;
}

export function newWithdrawalRef(userId: string): string {
  return `WD-${userId}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Client-facing shape for the withdrawal history list.
export function publicWithdrawal(w: WithdrawalDoc) {
  return {
    id: w.reference,
    amount: w.amountGhs,
    payout: w.momo.number,
    network: w.momo.network,
    status: w.status,
    at: w.at,                        // requested
    updatedAt: w.updatedAt || w.at,  // last status change (paid / declined / failed)
    reason: w.failureReason || null,
  };
}

export async function listWithdrawals(userId: string): Promise<WithdrawalDoc[]> {
  return queryWithdrawals({ userId });
}

// Refund a failed/reversed/rejected withdrawal back to the wallet — at most once.
async function refundWithdrawal(reference: string, reason: string, status: "failed" | "rejected" = "failed"): Promise<void> {
  const wd = await getWithdrawals();
  const doc = (await wd.findOne({ reference })) as WithdrawalDoc | null;
  if (!doc || doc.refunded) return;
  // Claim the refund so concurrent webhook deliveries can't double-credit.
  const claim = await wd.updateOne(
    { reference, refunded: { $ne: true } },
    { $set: { refunded: true, status, failureReason: reason, updatedAt: Date.now() } }
  );
  if (!claim || (claim as any).matchedCount === 0) return; // already refunded
  await addTx(doc.userId, {
    type: "refund",
    amount: doc.amountGhs,
    ref: reference,
    note: `Refund · withdrawal ${status === "rejected" ? "declined" : "not completed"} (${reason})`,
  });
  await notifyUser(doc.userId, {
    type: "payout",
    title: status === "rejected" ? "Payout declined" : "Payout didn't go through",
    body: `Your ${ghs(doc.amountGhs)} withdrawal to ${doc.momo.number} was ${status === "rejected" ? "declined" : "not completed"} (${reason}). The money is back in your wallet.`,
    icon: "refresh",
    link: "withdrawals",
    ref: reference,
  });
}

// Create a withdrawal REQUEST. Debits the wallet immediately (so the balance can't be spent
// twice) and records it as "requested" — pending admin action. Payouts are NOT sent here;
// an admin approves/pays them (manually or via Paystack) from the Payouts page, in bulk or
// one at a time.
export async function createWithdrawal(
  userId: string,
  amountGhs: number,
  momo: { number: string; network: string; name: string }
): Promise<{ ok: true; withdrawal: WithdrawalDoc; balance: number } | { ok: false; error: string }> {
  const amount = Math.round(Number(amountGhs) * 100) / 100;
  if (!amount || Number.isNaN(amount) || amount < MIN_WITHDRAW)
    return { ok: false, error: `Minimum withdrawal is ₵${MIN_WITHDRAW}.` };
  if (amount > MAX_WITHDRAW)
    return { ok: false, error: `Withdrawals are limited to ₵${MAX_WITHDRAW} at a time.` };

  const reference = newWithdrawalRef(userId);

  // Debit the wallet (authoritative overdraft check happens here — the amount is held).
  const debit = await addTx(userId, {
    type: "withdrawal",
    amount: -amount,
    ref: reference,
    note: `Withdrawal request to ${momo.network.toUpperCase()} ${momo.number}`,
  });
  if (!debit.ok) return { ok: false, error: debit.error };

  const now = Date.now();
  const doc: WithdrawalDoc = {
    reference, userId, amountGhs: amount, momo,
    status: "requested", refunded: false, at: now, updatedAt: now,
  };
  const wd = await getWithdrawals();
  await wd.insertOne(doc);
  await notifyUser(userId, {
    type: "payout",
    title: "Withdrawal requested",
    body: `${ghs(amount)} to ${momo.network.toUpperCase()} ${momo.number} is pending approval. We'll let you know the moment it's sent.`,
    link: "withdrawals",
    ref: reference,
  });
  await notifyAdmins({
    type: "payout",
    title: "New payout request",
    body: `An agent requested ${ghs(amount)} to ${momo.network.toUpperCase()} ${momo.number}.`,
    link: "withdrawals",
    ref: reference,
  });
  return { ok: true, withdrawal: doc, balance: debit.balance };
}

// Tell the agent their money is on its way (best-effort, once per payout).
async function notifyPaid(doc: WithdrawalDoc): Promise<void> {
  await notifyUser(doc.userId, {
    type: "payout",
    title: "Payout sent",
    body: `${ghs(doc.amountGhs)} is on its way to ${doc.momo.network.toUpperCase()} ${doc.momo.number}.`,
    icon: "coins",
    link: "withdrawals",
    ref: doc.reference,
  });
}

// ---- Admin payout actions ----

// Admin marks a requested payout as PAID after sending the money manually (bank app / MoMo).
// No Paystack transfer — the money already left the agent's wallet at request time.
export async function markWithdrawalPaid(reference: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const wd = await getWithdrawals();
  const doc = (await wd.findOne({ reference })) as WithdrawalDoc | null;
  if (!doc) return { ok: false, error: "Payout not found." };
  if (doc.status === "paid") return { ok: true };
  if (!["requested", "processing"].includes(doc.status)) return { ok: false, error: `Can't mark a ${doc.status} payout as paid.` };
  await wd.updateOne({ reference }, { $set: { status: "paid", updatedAt: Date.now() } });
  await notifyPaid(doc);
  return { ok: true };
}

// Admin declines a requested payout — refunds the held amount back to the agent's wallet.
export async function rejectWithdrawal(reference: string, reason = "Declined by admin"): Promise<{ ok: true } | { ok: false; error: string }> {
  const wd = await getWithdrawals();
  const doc = (await wd.findOne({ reference })) as WithdrawalDoc | null;
  if (!doc) return { ok: false, error: "Payout not found." };
  if (doc.status === "paid") return { ok: false, error: "That payout was already paid." };
  if (doc.status === "processing") return { ok: false, error: "That payout is being sent — can't reject it now." };
  if (doc.refunded || doc.status === "rejected" || doc.status === "failed") return { ok: true };
  await refundWithdrawal(reference, reason, "rejected");
  return { ok: true };
}

// Admin sends a requested payout via Paystack (single or bulk). Claims requested → processing,
// then registers the recipient + initiates the transfer; the transfer.* webhook settles it.
// On an API error it reverts to "requested" (retryable); on a hard transfer failure it refunds.
export async function dispatchWithdrawal(reference: string): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const wd = await getWithdrawals();
  const doc = (await wd.findOne({ reference })) as WithdrawalDoc | null;
  if (!doc) return { ok: false, error: "Payout not found." };
  if (doc.status !== "requested") return { ok: false, error: `Payout is already ${doc.status}.` };

  const claim = await wd.updateOne({ reference, status: "requested" }, { $set: { status: "processing", updatedAt: Date.now() } });
  if (!claim || (claim as any).matchedCount === 0) return { ok: false, error: "Payout already being handled." };

  const revert = async () => { await wd.updateOne({ reference }, { $set: { status: "requested", updatedAt: Date.now() } }); };

  // Dry mode (no Paystack key): mark paid so local/dev works.
  if (paystackMode() === "dry") {
    await wd.updateOne({ reference }, { $set: { status: "paid", updatedAt: Date.now() } });
    await notifyPaid(doc);
    return { ok: true, status: "paid" };
  }

  const rec = await createTransferRecipient({ name: doc.momo.name, momoNumber: doc.momo.number, network: doc.momo.network });
  if (!rec.ok) { await revert(); return { ok: false, error: rec.error }; }
  await wd.updateOne({ reference }, { $set: { recipientCode: rec.recipientCode } });

  const tr = await initiateTransfer({ amountGhs: doc.amountGhs, recipientCode: rec.recipientCode, reference, reason: "Agent payout" });
  if (!tr.ok) { console.error(`Payout transfer rejected for ${reference}:`, tr.error); await revert(); return { ok: false, error: tr.error }; }
  if (["failed", "abandoned", "reversed"].includes(tr.status)) {
    await refundWithdrawal(reference, `Transfer ${tr.status}`);
    return { ok: false, error: "The payout could not be sent — the agent was refunded." };
  }
  const status = tr.status === "success" ? "paid" : "processing";
  await wd.updateOne({ reference }, { $set: { transferCode: tr.transferCode, status, updatedAt: Date.now() } });
  if (status === "paid") await notifyPaid(doc);
  return { ok: true, status };
}

// All withdrawals with a given status (admin bulk actions).
export async function listWithdrawalsByStatus(status: string): Promise<WithdrawalDoc[]> {
  return queryWithdrawals({ status });
}

// Settle a withdrawal from a Paystack transfer webhook event (idempotent).
export async function settleWithdrawalByTransfer(
  transferCode: string,
  event: string
): Promise<{ settled: boolean }> {
  if (!transferCode) return { settled: false };
  const wd = await getWithdrawals();
  const doc = (await wd.findOne({ transferCode })) as WithdrawalDoc | null;
  if (!doc) return { settled: false };

  if (event === "transfer.success") {
    if (doc.status !== "paid") {
      await wd.updateOne({ reference: doc.reference }, { $set: { status: "paid", updatedAt: Date.now() } });
      await notifyPaid(doc);
    }
    return { settled: true };
  }
  if (event === "transfer.failed" || event === "transfer.reversed") {
    await refundWithdrawal(doc.reference, event.replace("transfer.", ""));
    return { settled: true };
  }
  return { settled: false };
}
