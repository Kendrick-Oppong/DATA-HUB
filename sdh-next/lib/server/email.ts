// Transactional email — OTP codes, receipts, order notices, support replies, ops alerts.
// SERVER ONLY (nodejs runtime — nodemailer can't run on the edge).
//
// ---- The three company mailboxes ----
// Every message the system sends is addressed from (or to) one of these. Personal inboxes
// are never used — see pickFrom()/opsInbox() below and MAILBOXES in .env.local.
//
//   noreply@sdhghana.com   Unattended sender for anything automated: OTP codes, receipts,
//                          delivery and AFA notices, announcements. Replies go to support@.
//   support@sdhghana.com   Monitored, human-facing. It is the Reply-To on ALL mail, and the
//                          From on correspondence a customer is expected to answer
//                          (support-desk replies). sendEmail(..., { from: "support" }).
//   admin@sdhghana.com     Internal operations inbox. Recipient only — never a From.
//                          Ops alerts (new agent application, new complaint) go here via
//                          opsInbox(), so they don't land in an individual's personal mail.
//
// Delivery is chosen at runtime:
//   1. SMTP (nodemailer) — if SMTP_USER + SMTP_PASS are set.
//   2. Resend HTTP API   — if RESEND_API_KEY is set (needs a verified domain).
//   3. Dev console        — otherwise the code is logged to the server terminal so
//      auth flows are testable without any provider.
//
// Google Workspace SMTP config (.env.local):
//   SMTP_USER      the Workspace mailbox that authenticates, e.g. noreply@sdhghana.com
//   SMTP_PASS      a Google *App Password* for that mailbox (Account → Security →
//                  2-Step Verification → App passwords). NOT the login password.
//   SMTP_HOST      default smtp.gmail.com   SMTP_PORT default 465 (SSL)
//   EMAIL_FROM     the noreply sender, e.g. "Smart Data Hub <noreply@sdhghana.com>"
//   EMAIL_SUPPORT_FROM  the support sender, e.g. "Smart Data Hub Support <support@sdhghana.com>"
//   EMAIL_REPLY_TO the monitored inbox replies land in — support@sdhghana.com
//   EMAIL_ADMIN    the ops inbox alerts are sent TO — admin@sdhghana.com
//
// Sending as support@ while authenticated as noreply@ needs support@ registered under the
// noreply mailbox's Gmail "Send mail as" (and verified), OR its own credentials in
// SUPPORT_SMTP_USER / SUPPORT_SMTP_PASS — which authenticate as support@ directly and are
// used automatically when present.
//
// IMPORTANT: Google rewrites the From header to the authenticated mailbox unless the
// address is that mailbox or one of its verified "Send mail as" aliases. If mail arrives
// showing the wrong sender, that's the cause — verify the alias in Gmail settings.
import nodemailer from "nodemailer";

// Which company mailbox a message is sent AS.
export type Mailbox = "noreply" | "support";

// Fallbacks are the real production addresses, so a missing env var degrades to the right
// company mailbox rather than to a personal one.
const NOREPLY_FROM = () => process.env.EMAIL_FROM || "Smart Data Hub <noreply@sdhghana.com>";
const SUPPORT_FROM = () => process.env.EMAIL_SUPPORT_FROM || "Smart Data Hub Support <support@sdhghana.com>";
const SUPPORT_REPLY_TO = () => process.env.EMAIL_REPLY_TO || "support@sdhghana.com";

// The public support address — the one customers are told to write to, and the Reply-To
// on every message we send. Safe to embed in copy shown to customers.
export function supportEmail(): string {
  const raw = SUPPORT_REPLY_TO();
  return (/<([^>]+)>/.exec(raw)?.[1] || raw).trim().toLowerCase();
}

// The internal operations inbox. Ops alerts go here — never to an admin's personal address.
export function opsInbox(): string {
  return (process.env.EMAIL_ADMIN || "admin@sdhghana.com").trim().toLowerCase();
}

// Everyone an operations alert (new agent application, new complaint) is emailed to.
// This is deliberately NOT "every user whose role is admin" — admins sign in with their
// own personal addresses, and company process mail must not land in a personal inbox.
// Extra company addresses can be added with EMAIL_OPS_EXTRA (comma-separated).
export function opsRecipients(): string[] {
  const set = new Set<string>([opsInbox()]);
  for (const e of (process.env.EMAIL_OPS_EXTRA || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    set.add(e);
  }
  return [...set].filter((e) => e.includes("@"));
}

// From + Reply-To for a mailbox. support@ is monitored, so it is its own reply address;
// noreply@ is unattended, so replies are pointed at support@.
function pickFrom(box: Mailbox): { from: string; replyTo: string } {
  return box === "support"
    ? { from: SUPPORT_FROM(), replyTo: SUPPORT_REPLY_TO() }
    : { from: NOREPLY_FROM(), replyTo: SUPPORT_REPLY_TO() };
}

// One transport per mailbox: support@ uses its own credentials when they're configured,
// otherwise both mailboxes share the default (noreply) connection and rely on the
// "Send mail as" alias.
const _transports: Partial<Record<Mailbox, nodemailer.Transporter>> = {};

function credsFor(box: Mailbox): { user: string; pass: string } | null {
  if (box === "support" && process.env.SUPPORT_SMTP_USER && process.env.SUPPORT_SMTP_PASS) {
    return { user: process.env.SUPPORT_SMTP_USER, pass: process.env.SUPPORT_SMTP_PASS };
  }
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return user && pass ? { user, pass } : null;
}

function smtpTransport(box: Mailbox = "noreply"): nodemailer.Transporter | null {
  const creds = credsFor(box);
  if (!creds) return null;
  if (!_transports[box]) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10) || 465;
    _transports[box] = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: creds,
      // Serverless invocations send a handful of mails at most, but a pooled connection
      // saves the TLS + auth handshake on bursts (e.g. an announcement blast).
      pool: true,
      maxConnections: 2,
    });
    warnFromMismatch(creds.user, pickFrom(box).from);
  }
  return _transports[box]!;
}

// One-time sanity check at transport creation: a From on a different domain than the
// authenticating mailbox is silently rewritten by Google, which is hard to spot in
// production because sending still "succeeds".
function warnFromMismatch(user: string, from: string): void {
  const addr = /<([^>]+)>/.exec(from)?.[1] || from;
  if (!addr.includes("@")) return;
  const domainOf = (s: string) => s.split("@")[1]?.toLowerCase() || "";
  if (domainOf(addr) !== domainOf(user)) {
    console.warn(
      `[email] EMAIL_FROM (${addr}) is on a different domain than SMTP_USER (${user}). ` +
        `Google will rewrite the sender unless it is a verified alias.`
    );
  }
}

// Verify the SMTP credentials and connection without sending anything.
// Used by `npm run email:test` and safe to call from a health check.
export async function verifyEmailTransport(box: Mailbox = "noreply"): Promise<{ ok: boolean; error?: string }> {
  const transport = smtpTransport(box);
  if (!transport) return { ok: false, error: "SMTP_USER / SMTP_PASS are not set" };
  try {
    await transport.verify();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SMTP verify failed" };
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  opts?: { from?: Mailbox }
): Promise<{ ok: boolean; dev?: boolean; error?: string }> {
  const box: Mailbox = opts?.from || "noreply";
  const { from, replyTo } = pickFrom(box);

  // 1. SMTP (Google Workspace, etc.)
  const transport = smtpTransport(box);
  if (transport) {
    try {
      await transport.sendMail({ from, to, subject, text, html, replyTo });
      return { ok: true };
    } catch (e: any) {
      console.error("SMTP email error:", e?.message);
      return { ok: false, error: "Could not send the email. Please try again." };
    }
  }

  // 2. Resend HTTP API
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const url = process.env.RESEND_API_URL || "https://api.resend.com/emails";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          ...(html ? { html } : {}),
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data?.id) return { ok: true };
      console.error("Resend email failed:", res.status, data);
      return { ok: false, error: data?.message || data?.error?.message || `Email provider error (${res.status})` };
    } catch (e: any) {
      console.error("Resend email error:", e?.message);
      return { ok: false, error: "Could not reach the email provider" };
    }
  }

  // 3. Dev fallback — no provider configured.
  console.log(`\n[DEV EMAIL → ${to}]\n  From: ${from}\n  Reply-To: ${replyTo}\n  Subject: ${subject}\n  ${text}\n`);
  return { ok: true, dev: true };
}

// Build the one-time-code email (subject + plain text + a simple branded HTML body).
export function otpEmail(
  code: string,
  purpose: "register" | "reset" | "withdraw",
  ttlMinutes: string | number
): { subject: string; text: string; html: string } {
  const what = purpose === "reset" ? "reset your password" : purpose === "withdraw" ? "confirm your withdrawal" : "verify your account";
  const subject = `${code} is your Smart Data Hub code`;
  const support = SUPPORT_REPLY_TO();
  const text =
    `Your Smart Data Hub code to ${what} is ${code}.\n` +
    `It expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.\n\n` +
    `Need help? Email ${support}.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 8px;font-size:18px">Smart Data Hub</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">Use this code to ${what}:</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#f1f5f9;border-radius:12px;padding:16px 0;text-align:center">${code}</div>
      <p style="margin:18px 0 0;color:#64748b;font-size:13px">This code expires in ${ttlMinutes} minutes. If you didn't request it, you can safely ignore this email.</p>
      <p style="margin:10px 0 0;color:#94a3b8;font-size:12px">Need help? Email <a href="mailto:${support}" style="color:#64748b">${support}</a>.</p>
    </div>`;
  return { subject, text, html };
}
