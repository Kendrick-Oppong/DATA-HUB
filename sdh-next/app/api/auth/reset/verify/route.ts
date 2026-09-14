import { NextResponse } from "next/server";
import { normalizeGhPhone } from "@/lib/server/phone";
import { verifyCode } from "@/lib/server/otp";
import { findByPhoneIntl, publicUser } from "@/lib/server/users";
import { setSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Forgot password: verify the reset OTP and sign the user in (proves phone ownership).
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const phone = normalizeGhPhone(String(b.phone || ""));
    const otp = String(b.otp || "");
    if (!phone) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });

    const v = await verifyCode(phone.intl, "reset", otp);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const u = await findByPhoneIntl(phone.intl);
    if (!u) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const res = NextResponse.json({ user: publicUser(u) });
    setSession(res, { uid: String(u._id), role: u.role });
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
