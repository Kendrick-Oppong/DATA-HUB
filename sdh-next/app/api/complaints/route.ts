import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { createComplaint, listComplaintsByUser, publicComplaint, notifyNewComplaint } from "@/lib/server/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the signed-in user's own complaints.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const list = await listComplaintsByUser(s.uid);
  return NextResponse.json({ complaints: list.map((c) => publicComplaint(c, "user")) });
}

// Raise a new complaint.
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const subject = String(b.subject || "").trim();
  const message = String(b.message || "").trim();
  if (!subject) return NextResponse.json({ error: "Add a subject." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Describe the issue." }, { status: 400 });

  const me = await findUserById(s.uid);
  const userName = String(me?.business || me?.name || "User");
  const doc = await createComplaint({
    userId: s.uid,
    userName,
    subject,
    category: String(b.category || "Other"),
    ref: String(b.ref || ""),
    message,
  });
  await notifyNewComplaint(doc);
  return NextResponse.json({ complaint: publicComplaint(doc, "user") });
}
