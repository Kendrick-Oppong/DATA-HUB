// Arkesel SMS integration. Sends a message to a Ghanaian number in intl form
// ("233XXXXXXXXX"). If ARKESEL_API_KEY is unset, the message is logged to the
// server console instead (dev fallback) so OTP flows are testable without keys.
// SERVER ONLY.

// The sender ID already identifies us on the handset (it shows as "SDH Ghana"), so the body
// must never repeat the company name: it reads like spam, and the wasted characters push
// messages toward a second billed segment. Stripped centrally rather than in each message,
// so a text added anywhere later can't quietly reintroduce it.
const BRAND_PREFIX = /^\s*(smart\s*data\s*hub|sdh(\s+ghana)?)\s*[:\-–—]+\s*/i;

// The platform's own sender ID, as registered with Arkesel. Every transactional message
// (OTPs, delivery texts) goes out under it, and it's offered to agents as the sender they
// can use before they've registered one of their own.
export function platformSenderId(): string {
  return process.env.ARKESEL_SENDER_ID || "SmartDataHub";
}

// The shared sender ID agents send BULK SMS under before they've registered one of their
// own. Deliberately NOT the transactional sender: our own OTPs and delivery texts must keep
// reading as us, while an agent's campaign goes out under a neutral shared name that's
// registered with Arkesel for exactly that purpose.
export function bulkSenderId(): string {
  return process.env.ARKESEL_BULK_SENDER_ID || "OrderRef";
}

export const arkeselConfigured = () => !!process.env.ARKESEL_API_KEY;

const SEND_URL = () => process.env.ARKESEL_SMS_URL || "https://sms.arkesel.com/api/v2/sms/send";
// Both other v2 endpoints hang off the same host as the send URL, so a staging override of
// ARKESEL_SMS_URL moves all three together instead of leaving two pointed at production.
const apiBase = () => SEND_URL().replace(/\/sms\/send\/?$/, "");

const timeout = () => Number(process.env.SMS_TIMEOUT_MS || 8000);

export interface SmsSendResult {
  ok: boolean;
  dev?: boolean;
  error?: string;
  /** Arkesel's per-recipient message ids, for a later delivery-report lookup. */
  ids?: { recipient: string; id: string }[];
  /** Recipients Arkesel accepted / rejected. On a whole-request failure, all are failed. */
  accepted?: string[];
  rejected?: string[];
}

// Send one message to many recipients in a single Arkesel request. Recipients must already
// be in intl form ("233XXXXXXXXX").
//
// Arkesel bills per recipient per page, and its v2 response reports each recipient
// individually — so a request can partly succeed. That per-recipient outcome is returned
// rather than flattened to a single boolean, because a bulk campaign has to refund the
// sender for exactly the recipients that were rejected, not for all or nothing.
export async function sendBulkSms(
  recipientsIntl: string[],
  message: string,
  senderId?: string
): Promise<SmsSendResult> {
  const key = process.env.ARKESEL_API_KEY;
  const sender = (senderId || platformSenderId()).slice(0, 11);
  const body = String(message || "").replace(BRAND_PREFIX, "").trim();
  const recipients = Array.from(new Set(recipientsIntl.filter(Boolean)));

  if (!recipients.length) return { ok: false, error: "No recipients.", accepted: [], rejected: [] };

  if (!key) {
    // Dev fallback — no Arkesel key configured.
    console.log(`\n[DEV SMS → ${recipients.length} recipient(s)] (sender: ${sender})\n  ${body}\n  ${recipients.join(", ")}\n`);
    return { ok: true, dev: true, accepted: recipients, rejected: [], ids: [] };
  }

  try {
    // Hard timeout. Transactional SMS is sent on the buy request's own path, so an SMS
    // provider that accepts the connection and then stalls would hold the buyer's purchase
    // open for as long as it liked. A text that never sends is a far smaller problem.
    const res = await fetch(SEND_URL(), {
      signal: AbortSignal.timeout(timeout()),
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ sender, message: body, recipients }),
    });
    const data: any = await res.json().catch(() => ({}));
    const okStatus = res.ok && (data.status === "success" || data.code === "ok" || data.status === "ok");

    if (!okStatus) {
      console.error("Arkesel SMS failed:", res.status, data);
      return {
        ok: false,
        error: data?.message || `SMS provider error (${res.status})`,
        accepted: [],
        rejected: recipients,
      };
    }

    // v2 success carries `data` as a per-recipient array: [{ recipient, id }, …]. Older
    // shapes return nothing useful — treat that as "the whole batch went", which is what
    // the HTTP success already told us.
    const rows: any[] = Array.isArray(data?.data) ? data.data : [];
    if (!rows.length) return { ok: true, accepted: recipients, rejected: [], ids: [] };

    const ids = rows
      .filter((r) => r?.id)
      .map((r) => ({ recipient: String(r.recipient || ""), id: String(r.id) }));
    const accepted = rows.map((r) => String(r?.recipient || "")).filter(Boolean);
    const rejected = recipients.filter((r) => !accepted.includes(r));
    return { ok: accepted.length > 0, accepted, rejected, ids };
  } catch (e: any) {
    console.error("Arkesel SMS error:", e?.message);
    return { ok: false, error: "Could not reach the SMS provider", accepted: [], rejected: recipients };
  }
}

// Single-recipient send — the transactional path (OTPs, delivery texts). Always goes out
// under the platform sender ID.
export async function sendSms(
  toIntl: string,
  message: string
): Promise<{ ok: boolean; dev?: boolean; error?: string }> {
  const r = await sendBulkSms([toIntl], message);
  return { ok: r.ok, dev: r.dev, error: r.error };
}

// Our remaining credit with Arkesel. `sms_balance` is the unit count messages are drawn
// from; `main_balance` is the cash on the account. Shown on the admin SMS page so a bulk
// campaign isn't sold to an agent minutes before the platform runs dry.
export async function smsBalance(): Promise<{ ok: boolean; units: number; cash: string | null; error?: string }> {
  const key = process.env.ARKESEL_API_KEY;
  if (!key) return { ok: false, units: 0, cash: null, error: "No SMS provider key configured." };
  try {
    const res = await fetch(`${apiBase()}/clients/balance-details`, {
      signal: AbortSignal.timeout(timeout()),
      headers: { "api-key": key },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.status !== "success") {
      return { ok: false, units: 0, cash: null, error: data?.message || `Balance check failed (${res.status})` };
    }
    return { ok: true, units: Number(data?.data?.sms_balance || 0), cash: data?.data?.main_balance ?? null };
  } catch (e: any) {
    return { ok: false, units: 0, cash: null, error: "Could not reach the SMS provider" };
  }
}
