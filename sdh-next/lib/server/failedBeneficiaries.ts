// Failed MTN beneficiary reports. SERVER ONLY.
//
// MTN rejects some data orders because the recipient isn't on the sender's beneficiary list
// ("can't add beneficiary" / "you're not in the beneficiary list"). Those numbers have to be
// added upstream by hand, so every one of them is collected here for an admin to action.
//
// Two ways a number lands in this table:
//   1. AUTOMATICALLY — a data purchase fails and the provider's message matches
//      isBeneficiaryError(). Called from the buy paths; see captureBeneficiaryFailure.
//   2. MANUALLY — an agent hits the error and reports the number from their dashboard, or an
//      admin adds one from the tracker.
//
// Reports are never de-duplicated away: the same number failing twice is a real signal that
// it still hasn't been fixed. Duplicates are surfaced in the UI instead (`repeat` count).
import { getFailedBeneficiaries, queryFailedBeneficiaries } from "./db";

export type FailedBeneficiaryStatus = "pending" | "resolved";
export type AddedByRole = "admin" | "agent" | "customer" | "system";

export interface FailedBeneficiaryDoc {
  id: string;                    // FB-…  our reference
  phoneNumber: string;           // local 0XXXXXXXXX — the number MTN refused
  // The provider's message. Kept because isBeneficiaryError() reads it to decide whether an
  // automatic failure belongs in this tracker at all — but it is no longer shown to anyone,
  // and a manual report gets a fixed wording rather than a chosen one.
  errorMessage: string;
  customerName?: string;         // legacy — no longer captured or displayed
  note?: string;                 // free text from a manual add
  orderRef?: string | null;      // the order that failed, when captured automatically
  net?: string;                  // network — effectively always "mtn", kept for clarity
  addedByUserId: string | null;  // who reported it (null for an automatic capture)
  addedByRole: AddedByRole;      // admin | agent | customer | system
  addedByName?: string;          // display name, resolved at write time
  status: FailedBeneficiaryStatus;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;           // admin user id
}

export function newFailedBeneficiaryId(): string {
  return "FB-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// ---- Error matching -------------------------------------------------------------------
//
// Providers word this differently and inconsistently ("Can't add beneficiary", "recipient is
// not in the beneficiary list", "beneficiary not added"…), so match on the distinctive word
// rather than on an exact phrase — an exact match would silently miss most real failures.
// Kept deliberately narrow: only messages that actually mention a beneficiary qualify, so an
// unrelated failure (insufficient balance, invalid number) never lands in this tracker.
export function isBeneficiaryError(message: string): boolean {
  const m = String(message || "").toLowerCase();
  if (!m.includes("beneficiar")) return false;   // covers beneficiary / beneficiaries
  return (
    m.includes("add") ||          // "can't add beneficiary", "unable to add beneficiary"
    m.includes("not in") ||       // "you're not in the beneficiary list"
    m.includes("not on") ||
    m.includes("list") ||
    m.includes("not found") ||
    m.includes("register")        // "beneficiary not registered"
  );
}

export async function createFailedBeneficiary(doc: FailedBeneficiaryDoc): Promise<void> {
  const c = await getFailedBeneficiaries();
  await c.insertOne(doc);
}

// Record a provider failure automatically. Best-effort by contract: the caller is in the
// middle of refunding a customer, and a bookkeeping write must never break that.
export async function captureBeneficiaryFailure(p: {
  phoneNumber: string;
  errorMessage: string;
  orderRef?: string | null;
  net?: string;
  userId?: string | null;
  role?: AddedByRole;
}): Promise<void> {
  try {
    if (!isBeneficiaryError(p.errorMessage)) return;
    const phone = String(p.phoneNumber || "").trim();
    if (!phone) return;
    const now = Date.now();
    await createFailedBeneficiary({
      id: newFailedBeneficiaryId(),
      phoneNumber: phone,
      errorMessage: String(p.errorMessage || "").trim().slice(0, 300),
      orderRef: p.orderRef || null,
      net: p.net || "mtn",
      addedByUserId: p.userId || null,
      addedByRole: p.role || "system",
      addedByName: "Automatic",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  } catch (e: any) {
    console.error("Failed-beneficiary capture error:", e?.message);
  }
}

// ---- Pre-purchase guard ----------------------------------------------------------------
//
// A number with a PENDING report is one MTN has already refused and that nobody has fixed
// upstream yet, so another order to it would fail exactly the same way. Blocking here —
// BEFORE any money moves — spares the buyer a charge-then-refund round trip and spares us
// the provider call.
//
// Resolving the report (an admin has had the number added to the beneficiary list) unblocks
// it automatically: only `pending` rows block. Beneficiary lists are an MTN-only concept, so
// every other network returns false without touching the database.
export async function isBlockedBeneficiary(net: string, phoneNumber: string): Promise<boolean> {
  try {
    if (String(net || "").toLowerCase() !== "mtn") return false;
    const digits = String(phoneNumber || "").replace(/\D/g, "");
    if (!digits) return false;
    const rows = (await queryFailedBeneficiaries({ status: "pending" })) as FailedBeneficiaryDoc[];
    return rows.some((r) => String(r.phoneNumber || "").replace(/\D/g, "") === digits);
  } catch (e: any) {
    // FAIL OPEN. This is a convenience check, not a security control — the provider is still
    // the authority on whether a number can receive data. A tracker outage must not stop
    // everyone buying MTN data, so on error we behave exactly as before this check existed.
    console.error("Beneficiary block check error:", e?.message);
    return false;
  }
}

// The caution shown to a buyer whose number is blocked. Built server-side so the app, the
// mobile-money flow and every agent storefront word it identically.
export const BENEFICIARY_BLOCK_TITLE = "New beneficiary number detected!";
export function beneficiaryBlock(phoneNumber: string) {
  return {
    phone: phoneNumber,
    title: BENEFICIARY_BLOCK_TITLE,
    body: [
      `The phone number ${phoneNumber} is not added to our beneficiary list at the moment. Number has been recorded and will be added to our beneficiary list. Please try again later.`,
      "This number is not on our beneficiary list and orders to it are currently blocked. Please use a verified number.",
    ],
  };
}

// ---- Queries --------------------------------------------------------------------------

export interface FailedBeneficiaryFilters {
  status?: FailedBeneficiaryStatus | "all";
  phone?: string;      // partial match
  q?: string;          // free search over phone, note and reporter
  from?: number;       // createdAt >= (epoch ms)
  to?: number;         // createdAt <= (epoch ms)
}

export async function listFailedBeneficiaries(f: FailedBeneficiaryFilters = {}): Promise<FailedBeneficiaryDoc[]> {
  // Status is pushed into the DB query; the text/date filters are applied in memory so the
  // same code works against Mongo and the in-memory fallback store without divergence.
  const base: any = {};
  if (f.status && f.status !== "all") base.status = f.status;
  let rows = (await queryFailedBeneficiaries(base)) as FailedBeneficiaryDoc[];

  const phone = String(f.phone || "").replace(/\D/g, "");
  if (phone) rows = rows.filter((r) => String(r.phoneNumber || "").replace(/\D/g, "").includes(phone));

  const q = String(f.q || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      [r.phoneNumber, r.note, r.addedByName]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }

  if (f.from) rows = rows.filter((r) => (r.createdAt || 0) >= f.from!);
  if (f.to) rows = rows.filter((r) => (r.createdAt || 0) <= f.to!);
  return rows;
}

export async function getFailedBeneficiary(id: string): Promise<FailedBeneficiaryDoc | null> {
  const c = await getFailedBeneficiaries();
  return ((await c.findOne({ id })) as FailedBeneficiaryDoc) || null;
}

export async function setFailedBeneficiaryStatus(
  id: string,
  status: FailedBeneficiaryStatus,
  adminId?: string
): Promise<FailedBeneficiaryDoc | null> {
  const c = await getFailedBeneficiaries();
  const doc = (await c.findOne({ id })) as FailedBeneficiaryDoc | null;
  if (!doc) return null;

  const now = Date.now();
  const set: any = { status, updatedAt: now };
  if (status === "resolved") { set.resolvedAt = now; if (adminId) set.resolvedBy = adminId; }
  else { set.resolvedAt = null; set.resolvedBy = null; }   // reopening clears the resolution

  await c.updateOne({ id }, { $set: set });
  return { ...doc, ...set };
}

export async function deleteFailedBeneficiary(id: string): Promise<boolean> {
  const c: any = await getFailedBeneficiaries();
  const doc = await c.findOne({ id });
  if (!doc) return false;
  if (typeof c.deleteOne === "function") await c.deleteOne({ id });
  else await c.updateOne({ id }, { $set: { deleted: true } });   // in-memory fallback
  return true;
}

// Client-facing shape. Includes `repeat`, the number of OTHER reports for the same phone —
// an admin needs to see at a glance that a number keeps failing.
export function publicFailedBeneficiary(r: FailedBeneficiaryDoc, all: FailedBeneficiaryDoc[] = []) {
  const digits = String(r.phoneNumber || "").replace(/\D/g, "");
  const repeat = all.filter((x) => String(x.phoneNumber || "").replace(/\D/g, "") === digits).length;
  return {
    id: r.id,
    phoneNumber: r.phoneNumber,
    note: r.note || "",
    orderRef: r.orderRef || null,
    net: r.net || "mtn",
    addedByRole: r.addedByRole,
    addedByName: r.addedByName || (r.addedByRole === "system" ? "Automatic" : "User"),
    status: r.status,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt || null,
    repeat,
  };
}
