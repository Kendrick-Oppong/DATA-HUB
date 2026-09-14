// Guest AFA registration payments — someone registering for AFA on an agent's public
// /<handle> storefront, paying by mobile money through Paystack. SERVER ONLY.
//
// Mirrors storeOrderPayments.ts. The guest pays the AGENT's own price; the admin-set fee
// goes to the platform and the agent keeps the difference, credited only once an admin
// approves the registration (see afa.ts). AFA still pays NO tier bonus and NO recruitment
// override — the agent's own margin is the whole of their upside.
//
// Flow: POST /api/store/<handle>/afa → validate the applicant, price from afaPricing, stash
// a pending intent, hand back Paystack's checkout URL. The registration is NOT created here
// — only once Paystack confirms (webhook charge.success, or the callback verify), so an
// abandoned checkout leaves nothing behind.
import { getPayments } from "./db";
import { AfaRegistrationDoc, announceAfaApplied, createAfaRegistration, newAfaRef } from "./afa";

export interface AfaPaymentDoc {
  reference: string;            // Paystack reference — the idempotency key (AFAPAY-…)
  kind: "afapay";               // discriminator (shares the `payments` collection)
  handle: string | null;        // storefront it came through
  amountGhs: number;            // what the guest pays — the AGENT's price
  fee: number;                  // the platform's admin-set share of it
  agentProfit: number;          // the agent's own margin, credited on approval
  agentUserId: string | null;   // store owner to credit

  // Applicant details, held until the payment confirms.
  name: string;
  phone: string;
  ghanaCard: string;
  location: string;
  occupation: string;
  dob: string;
  email: string;                // synthetic guest email for Paystack
  payerPhone: string | null;

  status: "pending" | "fulfilled";
  at: number;
  fulfilledAt?: number;
  afaRef?: string;              // the registration created once paid
}

export function newAfaPayRef(handle: string): string {
  const h = String(handle || "app").replace(/[^a-z0-9-]/gi, "").slice(0, 20);
  return `AFAPAY-${h}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// The webhook uses this to route a reference to the right fulfiller.
export function isAfaPayRef(reference: string): boolean {
  return reference.startsWith("AFAPAY-");
}

export async function createPendingAfaPayment(
  p: Omit<AfaPaymentDoc, "kind" | "status" | "at">
): Promise<void> {
  const payments = await getPayments();
  await payments.insertOne({ ...p, kind: "afapay", status: "pending", at: Date.now() } as AfaPaymentDoc);
}

// Create the registration for a confirmed payment — exactly once.
export async function fulfillAfaPayment(
  reference: string
): Promise<{ fulfilled: boolean; afaRef?: string; reason?: string }> {
  const payments = await getPayments();
  const doc = (await payments.findOne({ reference })) as AfaPaymentDoc | null;
  if (!doc || doc.kind !== "afapay") return { fulfilled: false, reason: "unknown reference" };
  if (doc.status === "fulfilled") return { fulfilled: false, afaRef: doc.afaRef, reason: "already fulfilled" };

  // Claim it: only the caller that flips pending → fulfilled creates the registration, so a
  // webhook and the browser callback arriving together can't produce two.
  const claim = await payments.updateOne(
    { reference, status: "pending" },
    { $set: { status: "fulfilled", fulfilledAt: Date.now() } }
  );
  if (!claim || (claim as any).matchedCount === 0) {
    const again = (await payments.findOne({ reference })) as AfaPaymentDoc | null;
    return { fulfilled: false, afaRef: again?.afaRef, reason: "already fulfilled" };
  }

  const now = Date.now();
  const ref = newAfaRef();
  const registration: AfaRegistrationDoc = {
    ref,
    userId: null,               // a guest — no account to attach it to
    storeHandle: doc.handle || null,
    role: "guest",
    name: doc.name,
    phone: doc.phone,
    ghanaCard: doc.ghanaCard,
    location: doc.location,
    occupation: doc.occupation,
    dob: doc.dob,
    amount: doc.amountGhs,
    fee: doc.fee,
    agentProfit: doc.agentProfit,
    agentUserId: doc.agentUserId || null,
    profitCredited: false,
    pay: "Mobile money",
    status: "pending",
    at: now,
    updatedAt: now,
  };
  await createAfaRegistration(registration);
  await payments.updateOne({ reference }, { $set: { afaRef: ref } });

  // Tell the applicant it's under review (SMS only — a guest has no account email).
  await announceAfaApplied(registration);

  return { fulfilled: true, afaRef: ref };
}
