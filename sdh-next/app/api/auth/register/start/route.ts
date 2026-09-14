import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { normalizeGhPhone } from "@/lib/server/phone";
import { findByEmail, findByPhoneIntl } from "@/lib/server/users";
import { generateCode, storeCode } from "@/lib/server/otp";
import { sendEmail, otpEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 1 of signup: validate, ensure the account is new, and send a 4-digit OTP.
// The pending account (with a hashed password) is parked in the otp record until
// the code is verified — no user is created yet.
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    // Anyone can sign up. Choosing "agent" doesn't grant the role — it files an application
    // an admin must approve; the account is created as a customer either way.
    const wantsAgent = b.role !== "customer";
    const business = wantsAgent ? String(b.business || "").trim() : "";
    const password = String(b.password || "");

    if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (wantsAgent && !business)
      return NextResponse.json({ error: "Please enter your business name." }, { status: 400 });
    if (!/\S+@\S+\.\S+/.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const phone = normalizeGhPhone(String(b.phone || ""));
    if (!phone) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    if (password.length < 4)
      return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });

    if (await findByEmail(email))
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    if (await findByPhoneIntl(phone.intl))
      return NextResponse.json({ error: "An account with this phone number already exists." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateCode();
    // A referral code (if any) rides along with the pending signup and is applied once the
    // OTP is verified and the account actually exists.
    const ref = String(b.ref || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    await storeCode(phone.intl, "register", code, { name, email, phone, passwordHash, role: "customer", wantsAgent, business, ref });

    const ttl = process.env.OTP_TTL_MINUTES || "10";
    const mail = otpEmail(code, "register", ttl);
    const sent = await sendEmail(email, mail.subject, mail.text, mail.html);
    if (!sent.ok)
      return NextResponse.json({ error: sent.error || "Could not send the code. Try again." }, { status: 502 });

    return NextResponse.json({ ok: true, phone: phone.local, email, dev: sent.dev || false });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
