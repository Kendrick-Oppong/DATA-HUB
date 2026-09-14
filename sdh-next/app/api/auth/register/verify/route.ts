import { NextResponse } from "next/server";
import { normalizeGhPhone } from "@/lib/server/phone";
import { verifyCode } from "@/lib/server/otp";
import { createUser, findByPhoneIntl, publicUser } from "@/lib/server/users";
import { notifyAgentApplied } from "@/lib/server/agentNotify";
import { recordReferral } from "@/lib/server/referrals";
import { setSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 2 of signup: verify the OTP, create the user, and start a session.
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const phone = normalizeGhPhone(String(b.phone || ""));
    const otp = String(b.otp || "");
    if (!phone) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });

    const v = await verifyCode(phone.intl, "register", otp);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    if (!v.payload)
      return NextResponse.json({ error: "Registration expired — please start again." }, { status: 400 });

    if (await findByPhoneIntl(phone.intl))
      return NextResponse.json({ error: "Account already exists — please sign in." }, { status: 409 });

    // Everyone is created as a customer; an "agent" signup files a pending application.
    const wantsAgent = !!v.payload.wantsAgent;
    const user = await createUser({ ...v.payload, role: "customer", agentStatus: wantsAgent ? "pending" : "none" });
    // Signed up with someone's code → record it (pending until their first order is delivered).
    if (v.payload.ref) await recordReferral(user, v.payload.ref);
    if (wantsAgent) await notifyAgentApplied(user);
    const res = NextResponse.json({ user: publicUser(user) });
    setSession(res, { uid: String(user._id), role: user.role });
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
