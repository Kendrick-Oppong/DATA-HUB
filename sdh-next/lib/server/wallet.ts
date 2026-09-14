// Per-user wallet: a persisted balance + transaction ledger. SERVER ONLY.
// Stored as one document per user so it works with both real Mongo and the
// in-memory dev store (findOne + updateOne/upsert only).
import { getWallets } from "./db";

export type TxType =
  | "topup" | "purchase" | "refund" | "external" | "withdrawal"
  | "commission" | "referral" | "override" | "bonus";

export interface LedgerEntry {
  id: string;
  type: TxType;
  amount: number; // signed: credits positive, debits negative
  ref: string;
  note: string;
  at: number;
  credit?: boolean; // promotional credit — spendable, but NOT part of the cash balance
}

// Promotional credit (referral rewards). Per the incentive spec §3 this is spendable on any
// product but is NOT withdrawable or cashable, and expires. It therefore lives OUTSIDE
// `balance` (which is real, withdrawable money) as a set of expiring grants that purchases
// draw down before touching cash.
export interface CreditGrant {
  id: string;
  amount: number;     // granted
  remaining: number;  // left to spend
  ref: string;
  note: string;
  at: number;
  expiresAt: number;
}

const money = (n: number) => Math.round(Number(n) * 100) / 100;

const liveGrants = (doc: any, now = Date.now()): CreditGrant[] =>
  (doc?.credits || []).filter((g: CreditGrant) => g && g.remaining > 0 && g.expiresAt > now);

export const creditBalanceOf = (doc: any, now = Date.now()): number =>
  money(liveGrants(doc, now).reduce((s, g) => s + g.remaining, 0));

export async function getWallet(
  userId: string
): Promise<{ balance: number; ledger: LedgerEntry[]; credit: number; credits: CreditGrant[] }> {
  const w = await getWallets();
  const doc = await w.findOne({ userId });
  const now = Date.now();
  return {
    balance: money(doc?.balance || 0),
    ledger: doc?.ledger || [],
    credit: creditBalanceOf(doc, now),
    credits: liveGrants(doc, now),
  };
}

// Append a signed transaction. Rejects debits that would overdraw the wallet.
export async function addTx(
  userId: string,
  tx: { type: TxType; amount: number; ref?: string; note?: string }
): Promise<{ ok: true; balance: number; entry: LedgerEntry } | { ok: false; error: string }> {
  const w = await getWallets();
  const doc = await w.findOne({ userId });
  const balance = money(doc?.balance || 0);
  const amount = money(tx.amount);

  if (!amount || Number.isNaN(amount)) return { ok: false, error: "Invalid amount." };

  const newBalance = money(balance + amount);
  if (newBalance < 0) return { ok: false, error: "Insufficient wallet balance." };

  const entry: LedgerEntry = {
    id: "L" + Date.now() + Math.floor(Math.random() * 1000),
    type: tx.type,
    amount,
    ref: tx.ref || "",
    note: tx.note || "",
    at: Date.now(),
  };
  const ledger = [entry, ...(doc?.ledger || [])];
  await w.updateOne({ userId }, { $set: { userId, balance: newBalance, ledger } }, { upsert: true });
  return { ok: true, balance: newBalance, entry };
}

// ---- promotional credit (spec §3) ----

// Grant expiring, non-withdrawable credit. Recorded in the ledger for transparency with
// `credit: true`, which keeps it out of the cash balance everything else is computed from.
export async function addCredit(
  userId: string,
  grant: { amount: number; days: number; ref?: string; note?: string; type?: TxType }
): Promise<{ ok: true; credit: number } | { ok: false; error: string }> {
  const amount = money(grant.amount);
  if (!(amount > 0)) return { ok: false, error: "Invalid credit amount." };

  const w = await getWallets();
  const doc = await w.findOne({ userId });
  const now = Date.now();
  const g: CreditGrant = {
    id: "C" + now + Math.floor(Math.random() * 1000),
    amount,
    remaining: amount,
    ref: grant.ref || "",
    note: grant.note || "",
    at: now,
    expiresAt: now + Math.max(1, Number(grant.days) || 60) * 86400e3,
  };
  const entry: LedgerEntry = {
    id: "L" + now + Math.floor(Math.random() * 1000),
    type: grant.type || "referral",
    amount,
    ref: g.ref,
    note: g.note,
    at: now,
    credit: true,
  };
  const credits = [g, ...(doc?.credits || [])];
  await w.updateOne(
    { userId },
    { $set: { userId, balance: money(doc?.balance || 0), ledger: [entry, ...(doc?.ledger || [])], credits } },
    { upsert: true }
  );
  return { ok: true, credit: creditBalanceOf({ credits }, now) };
}

// Pay for something: promotional credit is consumed FIRST (soonest-to-expire first), then
// real cash. This is what makes referral credit "spendable on any product" while never
// being withdrawable — it can only ever leave the wallet through a purchase.
export async function spend(
  userId: string,
  tx: { amount: number; ref?: string; note?: string; type?: TxType }
): Promise<
  | { ok: true; balance: number; credit: number; paidFromCredit: number; paidFromCash: number }
  | { ok: false; error: string }
> {
  const cost = money(tx.amount);
  if (!(cost > 0)) return { ok: false, error: "Invalid amount." };

  const w = await getWallets();
  const doc = await w.findOne({ userId });
  const now = Date.now();
  const balance = money(doc?.balance || 0);
  const credit = creditBalanceOf(doc, now);

  if (money(balance + credit) < cost) return { ok: false, error: "Insufficient wallet balance." };

  // Draw down grants, soonest expiry first, so credit isn't wasted.
  let owed = cost;
  const grants: CreditGrant[] = [...(doc?.credits || [])].sort((a, b) => (a?.expiresAt || 0) - (b?.expiresAt || 0));
  for (const g of grants) {
    if (owed <= 0) break;
    if (!g || g.remaining <= 0 || g.expiresAt <= now) continue;
    const take = Math.min(g.remaining, owed);
    g.remaining = money(g.remaining - take);
    owed = money(owed - take);
  }
  const paidFromCredit = money(cost - owed);
  const paidFromCash = owed;
  const newBalance = money(balance - paidFromCash);

  const entries: LedgerEntry[] = [];
  if (paidFromCash > 0)
    entries.push({ id: "L" + now + Math.floor(Math.random() * 1000), type: tx.type || "purchase", amount: -paidFromCash, ref: tx.ref || "", note: tx.note || "", at: now });
  if (paidFromCredit > 0)
    entries.push({ id: "L" + (now + 1) + Math.floor(Math.random() * 1000), type: tx.type || "purchase", amount: -paidFromCredit, ref: tx.ref || "", note: (tx.note || "") + " (paid with credit)", at: now, credit: true });

  await w.updateOne(
    { userId },
    { $set: { userId, balance: newBalance, ledger: [...entries, ...(doc?.ledger || [])], credits: grants } },
    { upsert: true }
  );
  return { ok: true, balance: newBalance, credit: creditBalanceOf({ credits: grants }, now), paidFromCredit, paidFromCash };
}

// Refund a purchase made through spend(): credit goes back as credit (keeping its original
// expiry window is not worth the complexity — a fresh 60 days is in the customer's favour),
// cash goes back as cash.
export async function refundSpend(
  userId: string,
  tx: { cash: number; credit: number; ref?: string; note?: string }
): Promise<void> {
  if (tx.cash > 0) await addTx(userId, { type: "refund", amount: tx.cash, ref: tx.ref, note: tx.note });
  if (tx.credit > 0) await addCredit(userId, { amount: tx.credit, days: 60, ref: tx.ref, note: tx.note, type: "refund" });
}
