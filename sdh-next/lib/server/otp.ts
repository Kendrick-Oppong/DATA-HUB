// One-time-code generation, storage (hashed) and verification. SERVER ONLY.
import bcrypt from "bcryptjs";
import { getOtps } from "./db";

export type OtpPurpose = "register" | "reset" | "withdraw";

export function generateCode(): string {
  // 4-digit code to match the 4-box UI
  return String(Math.floor(1000 + Math.random() * 9000));
}

const TTL_MS = (parseInt(process.env.OTP_TTL_MINUTES || "10", 10) || 10) * 60 * 1000;
const MAX_ATTEMPTS = 5;

// Store (or replace) a code for a phone+purpose, carrying an optional payload
// (e.g. the pending signup details for "register").
export async function storeCode(
  phoneIntl: string,
  purpose: OtpPurpose,
  code: string,
  payload: any = null
): Promise<void> {
  const otps = await getOtps();
  const codeHash = await bcrypt.hash(code, 10);
  await otps.updateOne(
    { phone: phoneIntl, purpose },
    {
      $set: {
        phone: phoneIntl,
        purpose,
        codeHash,
        payload,
        attempts: 0,
        expiresAt: new Date(Date.now() + TTL_MS),
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Dev aid: SMS can be slow, so also surface the code in the server terminal.
  // Never logs in production.
  if (process.env.NODE_ENV !== "production") {
    const ttl = process.env.OTP_TTL_MINUTES || "10";
    console.log(
      `\n🔑 [SDH OTP] ${purpose} code for ${phoneIntl}: ${code} (valid ${ttl} min)\n`
    );
  }
}

export async function verifyCode(
  phoneIntl: string,
  purpose: OtpPurpose,
  code: string
): Promise<{ ok: boolean; payload?: any; error?: string }> {
  const otps = await getOtps();
  const doc = await otps.findOne({ phone: phoneIntl, purpose });
  if (!doc) return { ok: false, error: "No code found — please request a new one." };
  if (new Date(doc.expiresAt).getTime() < Date.now()) {
    await otps.deleteOne({ _id: doc._id });
    return { ok: false, error: "This code has expired — request a new one." };
  }
  if ((doc.attempts || 0) >= MAX_ATTEMPTS) {
    await otps.deleteOne({ _id: doc._id });
    return { ok: false, error: "Too many attempts — request a new code." };
  }
  const good = await bcrypt.compare(String(code), doc.codeHash);
  if (!good) {
    await otps.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
    return { ok: false, error: "Incorrect code — please try again." };
  }
  await otps.deleteOne({ _id: doc._id });
  return { ok: true, payload: doc.payload };
}
