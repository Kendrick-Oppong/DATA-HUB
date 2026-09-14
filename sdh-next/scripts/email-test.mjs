// Verify the transactional-email setup end to end, without booting Next.
//
//   npm run email:test you@example.com            tests the noreply@ sender
//   npm run email:test you@example.com support    tests the support@ sender
//   npm run email:test you@example.com admin      sends to the admin@ ops inbox
//
// Step 1 proves the SMTP credentials work (wrong app password fails here).
// Step 2 proves the sender survives Google's rewrite — check the From line on the mail
// that lands: if it says anything other than the "from" printed below, the alias isn't
// verified. Run the "support" variant before going live: sending as support@ while
// authenticated as noreply@ needs support@ added under Gmail's "Send mail as".
import { loadEnvConfig } from "@next/env";
import nodemailer from "nodemailer";

loadEnvConfig(process.cwd());

const box = (process.argv[3] || "noreply").toLowerCase();
if (!["noreply", "support", "admin"].includes(box)) {
  console.error("Usage: npm run email:test <recipient@example.com> [noreply|support|admin]");
  process.exit(1);
}

// "admin" isn't a sender — it's the ops inbox, so it only overrides the recipient.
const opsInbox = (process.env.EMAIL_ADMIN || "admin@sdhghana.com").trim();
const to = box === "admin" ? process.argv[2] || opsInbox : process.argv[2];
if (!to || !to.includes("@")) {
  console.error("Usage: npm run email:test <recipient@example.com> [noreply|support|admin]");
  process.exit(1);
}

// support@ authenticates as itself when it has its own credentials, otherwise it rides
// the noreply connection and relies on the verified "Send mail as" alias.
const useSupportCreds = box === "support" && process.env.SUPPORT_SMTP_USER && process.env.SUPPORT_SMTP_PASS;
const user = useSupportCreds ? process.env.SUPPORT_SMTP_USER : process.env.SMTP_USER;
const pass = useSupportCreds ? process.env.SUPPORT_SMTP_PASS : process.env.SMTP_PASS;
if (!user || !pass) {
  console.error("SMTP_USER / SMTP_PASS are not set in .env.local");
  process.exit(1);
}
if (/PASTE_/.test(pass)) {
  console.error("SMTP_PASS is still the placeholder — paste the Google App Password first.");
  process.exit(1);
}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT || "465", 10) || 465;
const from =
  box === "support"
    ? process.env.EMAIL_SUPPORT_FROM || "Smart Data Hub Support <support@sdhghana.com>"
    : process.env.EMAIL_FROM || user;
const replyTo = process.env.EMAIL_REPLY_TO || undefined;

console.log(`mailbox ${box}`);
console.log(`host    ${host}:${port}`);
console.log(`auth    ${user}`);
console.log(`from    ${from}`);
console.log(`reply   ${replyTo || "(none)"}`);
console.log(`to      ${to}`);

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transport.verify();
  console.log("\n✓ SMTP connection + credentials OK");
} catch (e) {
  console.error("\n✗ SMTP verify failed:", e?.message);
  process.exit(1);
}

try {
  const info = await transport.sendMail({
    from,
    to,
    replyTo,
    subject: box === "noreply" ? "123456 is your Smart Data Hub code" : `Smart Data Hub ${box} mailbox test`,
    text: `This is a test of the Smart Data Hub ${box} mailbox.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 8px;font-size:18px">Smart Data Hub</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:14px">Test email — the ${box} mailbox setup is working.</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#f1f5f9;border-radius:12px;padding:16px 0;text-align:center">123456</div>
    </div>`,
  });
  console.log(`✓ Sent to ${to} (${info.messageId})`);
  console.log("\nNow open it and confirm the From address reads:", from);
  console.log("Also check the Spam folder — if it landed there, SPF/DKIM/DMARC need attention.");
} catch (e) {
  console.error("✗ Send failed:", e?.message);
  process.exit(1);
}

process.exit(0);
