import { NextResponse } from "next/server";
import { normalizeGhPhone } from "@/lib/server/phone";
import { findByPhoneIntl } from "@/lib/server/users";
import { generateCode, storeCode } from "@/lib/server/otp";
import { sendEmail, otpEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Forgot password: send a reset OTP to a registered phone.
// Always returns ok so we don't reveal whether the number is registered.
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const phone = normalizeGhPhone(String(b.phone || ""));
    if (!phone) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

    const u = await findByPhoneIntl(phone.intl);
    if (u && u.email) {
      const code = generateCode();
      await storeCode(phone.intl, "reset", code, { uid: String(u._id), role: u.role });
      const ttl = process.env.OTP_TTL_MINUTES || "10";
      const mail = otpEmail(code, "reset", ttl);
      await sendEmail(u.email, mail.subject, mail.text, mail.html);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
