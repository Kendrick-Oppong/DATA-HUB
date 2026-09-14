// AFA registration lifecycle: applied → (admin reviews) → approved | rejected. SERVER ONLY.
//
// AFA is a MANUAL, admin-reviewed product — there is no upstream API to call, so an
// application is stored, the applicant is told it's under review, and an admin decides.
// Every status change notifies the applicant by SMS and email.
//
// MONEY MODEL. The platform FEE is admin-set (afaPricing.ts) and is what an agent pays us.
// On their own storefront an agent may set a HIGHER selling price and keeps the difference
// as their own profit, credited when the registration is approved.
//
// What AFA deliberately does NOT pay, however it was sold:
//   - no tier bonus (payTierBonus is never called for AFA)
//   - no recruitment override to whoever recruited the agent
//   - no platform commission — the agent's only upside is their own margin
// Agents also cannot price it BELOW our fee; see priceAfaForStore.
import { getAfaRegistrations, queryAfaRegistrations } from "./db";
import { ghs, notifyUser } from "./notifications";
import { addTx } from "./wallet";
import { sendAfaAppliedNotice, sendAfaStatusNotice } from "./notify";

export type AfaStatus = "pending" | "approved" | "rejected";

export interface AfaRegistrationDoc {
  ref: string;              // AFA-…  customer-facing reference
  userId: string | null;    // the signed-in submitter; null for a guest storefront application
  storeHandle: string | null; // which agent's storefront it came through, if any
  role: string;             // submitter's role at the time (customer | reseller | guest)

  // Applicant details
  name: string;
  phone: string;            // local 0XXXXXXXXX — the MTN number being registered
  ghanaCard: string;        // canonical GHA-XXXXXXXXX-X (see ghanaCard.ts)
  location: string;
  occupation: string;
  dob: string;              // as entered, dd/mm/yyyy

  amount: number;           // what the applicant actually paid
  // On a STOREFRONT registration the agent sets their own selling price, so the payment
  // splits: `fee` is the platform's admin-set charge, `agentProfit` is the agent's own
  // margin, credited to them when the registration is APPROVED. In-app registrations pay
  // the fee exactly, so profit is 0.
  fee?: number;             // platform's admin-set fee
  agentProfit?: number;     // agent's own margin (amount − fee), never negative
  agentUserId?: string | null;   // the store owner to credit
  profitCredited?: boolean;      // claim guard — the agent is paid at most once
  pay: string;              // "Wallet" | "Mobile money"
  status: AfaStatus;
  adminNote?: string;       // optional reason shown to nobody but kept for the audit trail

  at: number;               // submitted
  updatedAt: number;
  reviewedAt?: number;      // admin set approved/rejected
  reviewedBy?: string;      // admin user id
}

export function newAfaRef(): string {
  return "AFA-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// What the client is allowed to see. The Ghana Card is masked everywhere except the admin
// desk — it's national-ID data and the applicant already knows their own number.
export function publicAfa(r: AfaRegistrationDoc, opts: { admin?: boolean } = {}) {
  return {
    id: r.ref,
    ref: r.ref,
    name: r.name,
    phone: r.phone,
    ghanaCard: opts.admin ? r.ghanaCard : maskCard(r.ghanaCard),
    location: r.location,
    occupation: r.occupation,
    profession: r.occupation,   // legacy key the existing UI reads
    dob: r.dob,
    amount: r.amount,
    price: r.amount,
    fee: r.fee ?? r.amount,
    agentProfit: r.agentProfit ?? 0,
    pay: r.pay || "Wallet",
    status: r.status,
    storeHandle: r.storeHandle || null,
    at: r.at,
    updatedAt: r.updatedAt,
    reviewedAt: r.reviewedAt || null,
    // AFA pays NO tier bonus and NO commission from the platform. Any money an agent makes
    // on it is their own margin (`agentProfit`) — surfaced as 0 here so no UI mistakes the
    // two for the same thing.
    commission: 0,
  };
}

// Credit the agent their own margin on a storefront registration — exactly once, and only
// once an admin has APPROVED it (the equivalent of "delivered" for a manual product).
//
// Deliberately NOT accompanied by payTierBonus or payRecruitmentOverride: AFA earns no tier
// bonus and no override. The agent keeps their own margin and nothing else.
async function creditAgentProfit(reg: AfaRegistrationDoc): Promise<void> {
  const profit = Math.round(Number(reg.agentProfit || 0) * 100) / 100;
  if (!reg.agentUserId || !(profit > 0) || reg.profitCredited) return;

  const c = await getAfaRegistrations();
  const claim = await c.updateOne(
    { ref: reg.ref, profitCredited: { $ne: true } },
    { $set: { profitCredited: true } }
  );
  if (!claim || (claim as any).matchedCount === 0) return;

  await addTx(reg.agentUserId, {
    type: "commission",
    amount: profit,
    ref: reg.ref,
    note: `Store sale · MTN AFA registration · ${reg.phone}`,
  });
  await notifyUser(reg.agentUserId, {
    type: "sale",
    title: "AFA registration approved",
    body: `${reg.name}'s AFA registration was approved. You earned ${ghs(profit)}.`,
    icon: "idcard",
    link: "store-orders",
    ref: reg.ref,
  });
}

export function maskCard(card: string): string {
  const s = String(card || "");
  const m = s.match(/^GHA-(\d{9})-(\d)$/);
  if (!m) return s;
  return `GHA-*****${m[1].slice(5)}-${m[2]}`;
}

export async function createAfaRegistration(doc: AfaRegistrationDoc): Promise<void> {
  const c = await getAfaRegistrations();
  await c.insertOne(doc);
}

export async function getAfaByRef(ref: string): Promise<AfaRegistrationDoc | null> {
  const c = await getAfaRegistrations();
  const doc = await c.findOne({ ref });
  return (doc as AfaRegistrationDoc) || null;
}

export async function listAfaByUser(userId: string): Promise<AfaRegistrationDoc[]> {
  return (await queryAfaRegistrations({ userId })) as AfaRegistrationDoc[];
}

export async function listAllAfa(): Promise<AfaRegistrationDoc[]> {
  return (await queryAfaRegistrations({})) as AfaRegistrationDoc[];
}

// A Ghana Card may hold one registration that is pending or already approved. A REJECTED
// one doesn't block a corrected re-application.
export async function cardAlreadyRegistered(ghanaCard: string): Promise<boolean> {
  const existing = (await queryAfaRegistrations({ ghanaCard })) as AfaRegistrationDoc[];
  return existing.some((r) => r.status === "pending" || r.status === "approved");
}

// Tell the applicant we have their application. Best-effort: a failed SMS must never undo a
// registration that has been paid for.
export async function announceAfaApplied(doc: AfaRegistrationDoc): Promise<void> {
  await Promise.allSettled([
    sendAfaAppliedNotice({ phone: doc.phone, userId: doc.userId, name: doc.name, ref: doc.ref }),
    doc.userId
      ? notifyUser(doc.userId, {
          type: "order",
          title: "AFA registration submitted",
          body: `${doc.name}'s AFA registration is under review. We'll let you know the outcome.`,
          icon: "idcard",
          link: "afa",
          ref: doc.ref,
        })
      : Promise.resolve(),
  ]);
}

// Admin decision. Idempotent — re-setting the same status changes nothing and re-notifies
// nobody, so a double-click can't text an applicant twice.
export async function setAfaStatus(
  ref: string,
  status: AfaStatus,
  adminId?: string
): Promise<{ ok: boolean; error?: string; registration?: AfaRegistrationDoc }> {
  if (status !== "approved" && status !== "rejected" && status !== "pending")
    return { ok: false, error: "Unknown status." };

  const c = await getAfaRegistrations();
  const doc = (await c.findOne({ ref })) as AfaRegistrationDoc | null;
  if (!doc) return { ok: false, error: "Registration not found." };
  if (doc.status === status) return { ok: true, registration: doc };

  const now = Date.now();
  const patch: any = { status, updatedAt: now };
  if (status === "approved" || status === "rejected") {
    patch.reviewedAt = now;
    if (adminId) patch.reviewedBy = adminId;
  }
  await c.updateOne({ ref }, { $set: patch });
  const updated = { ...doc, ...patch } as AfaRegistrationDoc;

  // Approved is AFA's "delivered": the agent's own margin is credited here and nowhere else,
  // so a rejected registration never pays them. Best-effort — a credit failure must not stop
  // the applicant being told the outcome.
  if (status === "approved") {
    try { await creditAgentProfit(updated); } catch (e: any) { console.error("AFA agent profit error:", e?.message); }
  }

  // Notify on every decision — this is the whole point of the review flow.
  if (status !== "pending") {
    await Promise.allSettled([
      sendAfaStatusNotice({ phone: updated.phone, userId: updated.userId, name: updated.name, ref: updated.ref, status }),
      updated.userId
        ? notifyUser(updated.userId, {
            type: "order",
            title: status === "approved" ? "AFA registration approved" : "AFA registration rejected",
            body:
              status === "approved"
                ? `${updated.name}'s AFA registration on ${updated.phone} is approved.`
                : `${updated.name}'s AFA registration on ${updated.phone} was not approved.`,
            icon: "idcard",
            link: "afa",
            ref: updated.ref,
          })
        : Promise.resolve(),
    ]);
  }

  return { ok: true, registration: updated };
}
