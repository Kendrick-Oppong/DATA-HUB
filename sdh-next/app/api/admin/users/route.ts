import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin, listUsers, setUserRole, approveAgent, rejectAgent, findUserById, adminUserView } from "@/lib/server/users";
import { notifyAgentApproved, notifyAgentRejected } from "@/lib/server/agentNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. List users for the Users page. ?q= filters by name/email/phone.
export async function GET(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const q = new URL(req.url).searchParams.get("q") || "";
  const users = await listUsers(q);
  return NextResponse.json({ users });
}

// Admin-only. Change a user's role (grant/remove admin, or set customer/reseller).
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const userId = String(b.userId || "");
  const action = String(b.action || "");
  if (!userId) return NextResponse.json({ error: "Missing user." }, { status: 400 });

  // Agent-application actions (approve grants the reseller role; reject keeps them a customer).
  if (action === "approveAgent" || action === "rejectAgent") {
    const res = action === "approveAgent" ? await approveAgent(userId) : await rejectAgent(userId);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    const fresh = await findUserById(userId);
    if (fresh) { if (action === "approveAgent") await notifyAgentApproved(fresh); else await notifyAgentRejected(fresh); }
    return NextResponse.json({ user: adminUserView(fresh) });
  }

  // Direct role change (grant/remove admin, or set customer/reseller).
  const role = String(b.role || "");
  const res = await setUserRole(userId, role);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ user: res.user });
}
