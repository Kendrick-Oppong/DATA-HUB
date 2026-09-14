import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getComplaint, addComplaintMessage, markComplaintRead, publicComplaint, notifyAdminsReply } from "@/lib/server/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user replies on — or marks read — their own complaint thread.
//   { message }        → post a reply (notifies admins)
//   { action: "read" } → mark the thread read (clears the user's unread badge)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const doc = await getComplaint(params.id);
  if (!doc || doc.userId !== s.uid) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });

  const b = await req.json().catch(() => ({}));

  if (b.action === "read") {
    const updated = await markComplaintRead(params.id, "user");
    return NextResponse.json({ complaint: updated ? publicComplaint(updated, "user") : null });
  }

  const message = String(b.message || "").trim();
  if (!message) return NextResponse.json({ error: "Type a message." }, { status: 400 });

  const updated = await addComplaintMessage(params.id, "user", message);
  if (updated) await notifyAdminsReply(updated, message);
  return NextResponse.json({ complaint: updated ? publicComplaint(updated, "user") : null });
}
