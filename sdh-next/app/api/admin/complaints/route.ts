import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import {
  listAllComplaints,
  publicComplaint,
  setComplaintStatus,
  addComplaintMessage,
  getComplaint,
  markComplaintRead,
  notifyUserReply,
} from "@/lib/server/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin support desk — every complaint on the platform.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const list = await listAllComplaints();
  return NextResponse.json({ complaints: list.map((c) => publicComplaint(c, "admin")) });
}

// Admin acts on a complaint:
//   { id, action: "status", status: "open"|"in-review"|"resolved" }
//   { id, action: "reply",  message }
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  const action = String(b.action || "");
  if (!id) return NextResponse.json({ error: "Missing complaint id." }, { status: 400 });

  if (action === "read") {
    const updated = await markComplaintRead(id, "admin");
    return NextResponse.json({ complaint: updated ? publicComplaint(updated, "admin") : null });
  }
  if (action === "status") {
    const ok = await setComplaintStatus(id, b.status);
    if (!ok) return NextResponse.json({ error: "Could not update the complaint." }, { status: 400 });
    const doc = await getComplaint(id);
    return NextResponse.json({ complaint: doc ? publicComplaint(doc, "admin") : null });
  }
  if (action === "reply") {
    const message = String(b.message || "").trim();
    if (!message) return NextResponse.json({ error: "Type a reply." }, { status: 400 });
    const updated = await addComplaintMessage(id, "support", message);
    if (!updated) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    await notifyUserReply(updated, message);
    return NextResponse.json({ complaint: publicComplaint(updated, "admin") });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
