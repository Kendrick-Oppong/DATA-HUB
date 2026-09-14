import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findByLogin, publicUser, ensureBootstrapAdmin } from "@/lib/server/users";
import { setSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sign in with email-or-phone + password. No OTP (matches the UI).
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const loginId = String(b.loginId || "").trim();
    const password = String(b.password || "");
    if (!loginId || !password)
      return NextResponse.json({ error: "Enter your email/phone and password." }, { status: 400 });

    const found = await findByLogin(loginId);
    // Same message for "no account" and "wrong password" to avoid account enumeration.
    if (!found || !(await bcrypt.compare(password, found.passwordHash)))
      return NextResponse.json({ error: "Incorrect email/phone or password." }, { status: 401 });

    // Promote the first admin(s) listed in ADMIN_EMAILS.
    const u = await ensureBootstrapAdmin(found);
    const res = NextResponse.json({ user: publicUser(u) });
    setSession(res, { uid: String(u._id), role: u.role });
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
