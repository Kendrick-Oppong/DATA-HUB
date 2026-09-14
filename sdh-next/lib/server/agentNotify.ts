// Agent-application notifications (SMS + email). SERVER ONLY. All best-effort — a send
// failure never blocks the signup/approval flow.
import { sendSms } from "./arkesel";
import { opsRecipients, sendEmail, supportEmail } from "./email";

const appUrl = () => (process.env.APP_BASE_URL || "https://www.sdhghana.com").replace(/\/+$/, "");
// Our WhatsApp channel — offered to applicants so the wait for approval isn't dead air.
const waChannel = () => process.env.WHATSAPP_CHANNEL_URL || "https://whatsapp.com/channel/0029Vb7y5vR72WTpvfRVKm24";
const firstName = (u: any) => String(u?.name || "there").split(" ")[0];
const phoneIntl = (u: any) => u?.phone?.intl || null;

// Application received → confirm to the applicant + alert the admins.
export async function notifyAgentApplied(user: any): Promise<void> {
  const name = firstName(user);
  try { if (user.email) await sendEmail(String(user.email), "Your Smart Data Hub agent application", `Hi ${name},\n\nWe've received your application to become a Smart Data Hub agent. Our team will review it and you'll be notified as soon as it's approved.\n\nWhile you wait, follow our WhatsApp channel for price drops, restocks and tips:\n${waChannel()}\n\nIn the meantime you can keep using your account as a customer.\n\nThank you.`); } catch {}
  // Kept under 160 GSM-7 characters so the channel link doesn't cost a second SMS segment.
  try { const p = phoneIntl(user); if (p) await sendSms(p, `Your agent application is under review. We'll inform you once approved. Join our WhatsApp channel: ${waChannel()}`); } catch {}
  try {
    const to = opsRecipients();
    const subject = `New agent application · ${user.name}`;
    const text = `${user.name} (${user.phone?.local || ""}${user.business ? ", " + user.business : ""}) applied to become an agent.\n\nReview & approve on the admin Users page: ${appUrl()}/admin`;
    for (const t of to) { try { await sendEmail(t, subject, text); } catch {} }
  } catch {}
}

// Approved → tell the new agent.
export async function notifyAgentApproved(user: any): Promise<void> {
  const name = firstName(user);
  try { if (user.email) await sendEmail(String(user.email), "You're now a Smart Data Hub agent 🎉", `Hi ${name},\n\nGreat news — your agent application has been approved! You can now open your agent dashboard, set up your online store and start earning commission on every sale.\n\nSign in to get started: ${appUrl()}`); } catch {}
  try { const p = phoneIntl(user); if (p) await sendSms(p, `Your agent account is approved! Sign in to open your agent dashboard and start earning.`); } catch {}
}

// Rejected → let the applicant know.
export async function notifyAgentRejected(user: any): Promise<void> {
  const name = firstName(user);
  try { if (user.email) await sendEmail(String(user.email), "Update on your agent application", `Hi ${name},\n\nThank you for your interest in becoming a Smart Data Hub agent. After review, we're unable to approve your application at this time. You can still use your customer account, and you're welcome to apply again later.\n\nIf you have questions, reply to this email or write to ${supportEmail()}.`, undefined, { from: "support" }); } catch {}
  try { const p = phoneIntl(user); if (p) await sendSms(p, `We couldn't approve your agent application at this time. You can still use your account and reapply later.`); } catch {}
}
