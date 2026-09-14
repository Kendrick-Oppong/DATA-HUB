import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readSession } from "@/lib/server/session";
import { findUserById, updateUserById } from "@/lib/server/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Change the signed-in user's password. Requires the current password.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const me = await findUserById(s.uid);
    if (!me) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const current = String(b.current || "");
    const next = String(b.next || "");

    if (next.length < 4)
      return NextResponse.json({ error: "New password must be at least 4 characters." }, { status: 400 });

    if (!(await bcrypt.compare(current, me.passwordHash)))
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });

    if (await bcrypt.compare(next, me.passwordHash))
      return NextResponse.json({ error: "New password must be different from the current one." }, { status: 400 });

    const passwordHash = await bcrypt.hash(next, 10);
    await updateUserById(s.uid, { passwordHash, passwordChangedAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
