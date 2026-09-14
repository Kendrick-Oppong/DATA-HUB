import { NextResponse } from "next/server";
import { readSession, setSession } from "@/lib/server/session";
import { findUserById, publicUser, ensureBootstrapAdmin } from "@/lib/server/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Restore the current session (called on app load).
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  const found = await findUserById(s.uid);
  if (!found) return NextResponse.json({ user: null }, { status: 401 });
  // Promote the first admin(s) listed in ADMIN_EMAILS on session restore.
  const u = await ensureBootstrapAdmin(found);
  const res = NextResponse.json({ user: publicUser(u) });
  // Keep the session cookie's role in sync with the live DB role (e.g. after an admin
  // approves an agent) so server routes price & authorize correctly without a re-login.
  if (String(u.role) !== String(s.role)) setSession(res, { uid: String(u._id), role: u.role });
  return res;
}
