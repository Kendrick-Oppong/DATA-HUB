// Bulk-SMS campaigns, fulfilled through Arkesel. SERVER ONLY.
//
// Flow: the sender's wallet is debited for the WHOLE campaign up front (priced server-side
// from smsPricing), Arkesel is handed the batch, and any recipient the provider rejected is
// refunded straight away. Charging first and refunding the shortfall — rather than sending
// first and billing after — is what stops an empty wallet from sending free SMS, and Arkesel
// gives us the per-recipient outcome in the same response, so the refund lands in the same
// request rather than waiting on a reconciliation pass.
//
// A campaign is never partially "pending": Arkesel accepts or rejects each recipient
// synchronously. Handset DELIVERY is a separate, later fact — we keep each recipient's
// provider message id so a delivery report can be pulled, but the platform bills on
// acceptance, exactly as Arkesel bills us.
import { getSmsCampaigns, querySmsCampaigns } from "./db";
import { sendBulkSms } from "./arkesel";
import { addTx } from "./wallet";
import { ghs, notifyUser } from "./notifications";
import { PricedSms, smsAmount } from "./smsPricing";

export type SmsCampaignStatus = "sent" | "partial" | "failed";

export interface SmsCampaignDoc {
  ref: string;                  // SMS-…
  userId: string;
  role: string;                 // customer | reseller | admin
  sender: string;               // sender ID it went out as
  message: string;
  pages: number;                // billable pages per recipient
  recipients: string[];         // intl form, deduped
  recipientCount: number;
  unitRate: number;             // charged per page per recipient
  cost: number;                 // debited from the wallet
  supplierCost: number;         // what Arkesel bills us — platform margin reference
  refunded: number;             // returned for rejected recipients
  sentCount: number;
  failedCount: number;
  status: SmsCampaignStatus;
  providerIds: { recipient: string; id: string }[];
  error: string | null;
  dev: boolean;                 // sent through the no-key dev fallback, not really delivered
  at: number;
  updatedAt: number;
}

export function newSmsRef(): string {
  return "SMS-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// Client-facing shape. The full recipient list is deliberately NOT sent back — a campaign to
// 2,000 numbers would bloat every history fetch, and the count is what the UI shows.
export function publicSmsCampaign(c: SmsCampaignDoc) {
  return {
    id: c.ref,
    sender: c.sender,
    message: c.message,
    pages: c.pages,
    recipients: c.recipientCount,
    sent: c.sentCount,
    failed: c.failedCount,
    rate: c.unitRate,
    cost: c.cost,
    refunded: c.refunded,
    status: c.status,
    error: c.error || null,
    dev: !!c.dev,
    at: c.at,
    userId: c.userId,
  };
}

export async function listSmsCampaignsByUser(userId: string): Promise<SmsCampaignDoc[]> {
  return querySmsCampaigns({ userId });
}

export async function listAllSmsCampaigns(): Promise<SmsCampaignDoc[]> {
  return querySmsCampaigns({});
}

// Send a priced campaign. The wallet must ALREADY have been debited by the caller (the
// route does it, so an insufficient balance is rejected before we ever touch Arkesel);
// this function owns the send, the record and the refund of whatever didn't go.
export async function runSmsCampaign(p: {
  ref: string;
  userId: string;
  role: string;
  sender: string;
  message: string;
  recipientsIntl: string[];
  priced: PricedSms;
}): Promise<SmsCampaignDoc> {
  const { ref, userId, role, sender, message, recipientsIntl, priced } = p;
  const now = Date.now();

  const result = await sendBulkSms(recipientsIntl, message, sender);
  const accepted = result.accepted || [];
  const rejected = result.rejected || [];

  // Refund the rejected recipients at exactly the rate they were charged, so a campaign that
  // half-failed costs half. Priced through the same helper as the charge, so the refund can
  // never round differently from the debit it reverses.
  const refund = smsAmount(priced.pages, rejected.length, priced.unitRate);
  const status: SmsCampaignStatus = accepted.length === 0 ? "failed" : rejected.length ? "partial" : "sent";

  const doc: SmsCampaignDoc = {
    ref,
    userId,
    role,
    sender,
    message,
    pages: priced.pages,
    recipients: recipientsIntl,
    recipientCount: recipientsIntl.length,
    unitRate: priced.unitRate,
    // What the campaign actually cost the sender, and what it costs us — both counted on the
    // recipients Arkesel accepted, since that's all either side is billed for.
    cost: Math.round((priced.cost - refund) * 100) / 100,
    supplierCost: smsAmount(priced.pages, accepted.length, priced.supplierRate),
    refunded: refund,
    sentCount: accepted.length,
    failedCount: rejected.length,
    status,
    providerIds: result.ids || [],
    error: result.error || null,
    dev: !!result.dev,
    at: now,
    updatedAt: now,
  };

  const c = await getSmsCampaigns();
  await c.insertOne(doc);

  if (refund > 0) {
    await addTx(userId, {
      type: "refund",
      amount: refund,
      ref,
      note: `SMS refund · ${rejected.length} recipient${rejected.length === 1 ? "" : "s"} not accepted`,
    });
  }

  if (status === "failed") {
    await notifyUser(userId, {
      type: "account",
      title: "Your SMS campaign didn't send",
      body: `${result.error || "The SMS provider rejected the batch."} ${ghs(refund)} is back in your wallet.`,
      icon: "mail",
      link: "sms",
      ref,
    });
  } else if (status === "partial") {
    await notifyUser(userId, {
      type: "account",
      title: "Some SMS didn't send",
      body: `${accepted.length} of ${recipientsIntl.length} messages went out. ${ghs(refund)} for the rest is back in your wallet.`,
      icon: "mail",
      link: "sms",
      ref,
    });
  }

  return doc;
}
