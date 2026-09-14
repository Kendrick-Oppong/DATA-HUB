// Customer notifications for order events. SERVER ONLY.
// Kept separate from the SMS transport (arkesel.ts) so the message copy lives in one
// place and a send failure can never break the order flow.
import { sendSms } from "./arkesel";
import { sendEmail } from "./email";
import { normalizeGhPhone } from "./phone";
import { findUserById } from "./users";

const NET_NAME: Record<string, string> = { mtn: "MTN", telecel: "Telecel", atigo: "AT" };

const money = (n: number) => `GH₵${Number(n || 0).toFixed(2)}`;

// Paystack requires an email, so checkout invents one for buyers who have none. It's not a
// real inbox — mailing it would bounce every time.
const SYNTHETIC_EMAIL_DOMAIN = "@wallet.smartdatahub.gh";
function realEmail(raw: any): string | null {
  const email = String(raw || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  if (email.endsWith(SYNTHETIC_EMAIL_DOMAIN)) return null;
  return email;
}

// Text the recipient the moment their bundle has been sent. Best-effort: any failure
// is swallowed (logged) so it never rolls back or 500s a successful purchase.
export async function sendDeliverySms(p: {
  recipient: string; // local phone (0XXXXXXXXX) or intl — normalized here
  pkg: string;        // e.g. "1GB · 30 days"
  net: string;        // mtn | telecel | atigo
  ref: string;        // order reference
}): Promise<void> {
  try {
    const phone = normalizeGhPhone(p.recipient);
    if (!phone) return;
    const net = NET_NAME[p.net] || p.net.toUpperCase();
    const msg = `${p.pkg} has been sent to ${phone.local} on ${net}. Enjoy! Ref ${p.ref}`;
    await sendSms(phone.intl, msg);
  } catch (e: any) {
    console.error("Delivery SMS error:", e?.message);
  }
}

// Email the BUYER a receipt once the provider confirms delivery.
//
// It goes to the buyer, not the recipient: an order only ever records the recipient's phone
// number, so their email simply isn't something we hold. The recipient is told by SMS above.
//
// Best-effort like the SMS — the money has already moved and the order is already delivered,
// so a mail provider having a bad day must never surface as a failed purchase.
export async function sendDeliveryEmail(p: {
  userId: string;
  pkg: string;        // e.g. "1GB · 30 days" / "GH₵10.00 airtime"
  net: string;        // mtn | telecel | atigo
  recipient: string;  // the number that received it
  ref: string;        // order reference
  cost: number;       // what the buyer paid
}): Promise<void> {
  try {
    const user = await findUserById(p.userId);
    const to = realEmail((user as any)?.email);
    if (!to) return;   // no usable address on the account — SMS already covers delivery

    const phone = normalizeGhPhone(p.recipient);
    const number = phone ? phone.local : p.recipient;
    const net = NET_NAME[p.net] || p.net.toUpperCase();
    const name = String((user as any)?.name || "").split(" ")[0];

    const subject = `Delivered: ${p.pkg} to ${number}`;
    const text =
      `${name ? `Hi ${name},\n\n` : ""}${p.pkg} has been delivered to ${number} on ${net}.\n\n` +
      `Order: ${p.ref}\nPaid: ${money(p.cost)}\n\n` +
      `Thank you for using Smart Data Hub.`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 8px;font-size:18px">Smart Data Hub</h2>
        <p style="margin:0 0 18px;color:#475569;font-size:14px">${name ? `Hi ${name}, your` : "Your"} order has been delivered.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px 18px;font-size:14px">
          <div style="font-size:17px;font-weight:700;margin-bottom:10px">${p.pkg}</div>
          <div style="color:#475569">Sent to <strong style="color:#0f172a">${number}</strong> on ${net}</div>
        </div>
        <table style="width:100%;margin-top:18px;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:7px 0;color:#64748b">Order</td><td style="padding:7px 0;text-align:right;font-family:ui-monospace,monospace">${p.ref}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b">Paid</td><td style="padding:7px 0;text-align:right;font-weight:700">${money(p.cost)}</td></tr>
        </table>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px">Thank you for using Smart Data Hub.</p>
      </div>`;
    await sendEmail(to, subject, text, html);
  } catch (e: any) {
    console.error("Delivery email error:", e?.message);
  }
}

// Text the buyer their result-checker voucher (serial + PIN) once fulfilled. Best-effort.
export async function sendCheckerSms(p: {
  recipient: string;  // local or intl — normalized here
  product: string;    // e.g. "WASSCE Checker"
  pin: string;
  serial: string;
  ref: string;
}): Promise<void> {
  try {
    const phone = normalizeGhPhone(p.recipient);
    if (!phone) return;
    const msg = `Your ${p.product} is ready. Serial: ${p.serial}  PIN: ${p.pin}. Keep it safe. Ref ${p.ref}`;
    await sendSms(phone.intl, msg);
  } catch (e: any) {
    console.error("Checker SMS error:", e?.message);
  }
}

// ---- AFA registration ----
// AFA is reviewed by hand, so the applicant hears from us twice: once on submission, once
// when an admin decides. Both go to the number being registered AND, when we have one, to
// the submitter's account email. Every send is best-effort — the registration is already
// paid for and stored, so a provider outage must never surface as a failed application.
//
// The SMS bodies are kept inside one GSM-7 segment (160 chars) so a notification never costs
// two messages; sendSms() strips any brand prefix, since the sender ID already says who we are.

async function emailSubmitter(userId: string | null, subject: string, text: string, html: string): Promise<void> {
  if (!userId) return;   // guest storefront application — no account, so SMS only
  try {
    const user = await findUserById(userId);
    const to = realEmail((user as any)?.email);
    if (to) await sendEmail(to, subject, text, html);
  } catch (e: any) {
    console.error("AFA email error:", e?.message);
  }
}

function afaHtml(heading: string, lead: string, rows: [string, string][], footer: string): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 8px;font-size:18px">Smart Data Hub</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">${lead}</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 18px">
        <div style="font-size:17px;font-weight:700">${heading}</div>
      </div>
      <table style="width:100%;margin-top:18px;font-size:14px;border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="padding:7px 0;color:#64748b">${k}</td><td style="padding:7px 0;text-align:right">${v}</td></tr>`).join("")}
      </table>
      <p style="margin:20px 0 0;color:#64748b;font-size:13px">${footer}</p>
    </div>`;
}

// Submitted → "we have it, it's under review".
export async function sendAfaAppliedNotice(p: {
  phone: string;            // the MTN number being registered
  userId: string | null;    // submitter, for the email copy
  name: string;             // applicant's name
  ref: string;
}): Promise<void> {
  try {
    const phone = normalizeGhPhone(p.phone);
    if (phone) {
      await sendSms(
        phone.intl,
        `AFA registration for ${phone.local} received and under review. We'll inform you once it's approved. Ref ${p.ref}`
      );
    }
    await emailSubmitter(
      p.userId,
      "Your AFA registration is under review",
      `Hi ${p.name},\n\nWe've received the AFA registration for ${p.phone} and it is now under review.\n\nReference: ${p.ref}\n\nWe'll let you know by SMS and email as soon as it has been reviewed.\n\nThank you.`,
      afaHtml(
        "MTN AFA registration",
        `Hi ${p.name}, we've received your registration and it's now under review.`,
        [["Number", p.phone], ["Reference", p.ref], ["Status", "Under review"]],
        "We'll notify you by SMS and email as soon as it has been reviewed."
      )
    );
  } catch (e: any) {
    console.error("AFA applied notice error:", e?.message);
  }
}

// Admin decided → approved or rejected.
export async function sendAfaStatusNotice(p: {
  phone: string;
  userId: string | null;
  name: string;
  ref: string;
  status: "approved" | "rejected";
}): Promise<void> {
  try {
    const approved = p.status === "approved";
    const phone = normalizeGhPhone(p.phone);
    if (phone) {
      await sendSms(
        phone.intl,
        approved
          ? `Good news! The AFA registration for ${phone.local} is approved. You can now buy discounted AFA bundles. Ref ${p.ref}`
          : `The AFA registration for ${phone.local} was not approved. Please contact support for help. Ref ${p.ref}`
      );
    }
    await emailSubmitter(
      p.userId,
      approved ? "Your AFA registration is approved" : "Update on your AFA registration",
      approved
        ? `Hi ${p.name},\n\nGood news — the AFA registration for ${p.phone} has been approved. Discounted AFA bundles are now available on that number.\n\nReference: ${p.ref}\n\nThank you.`
        : `Hi ${p.name},\n\nAfter review, the AFA registration for ${p.phone} could not be approved.\n\nReference: ${p.ref}\n\nPlease contact our support team if you'd like help or want to try again.`,
      afaHtml(
        approved ? "AFA registration approved" : "AFA registration not approved",
        approved
          ? `Hi ${p.name}, your registration has been approved.`
          : `Hi ${p.name}, we couldn't approve this registration.`,
        [["Number", p.phone], ["Reference", p.ref], ["Status", approved ? "Approved" : "Not approved"]],
        approved
          ? "Discounted AFA bundles are now available on that number."
          : "Contact our support team if you'd like help or want to apply again."
      )
    );
  } catch (e: any) {
    console.error("AFA status notice error:", e?.message);
  }
}
