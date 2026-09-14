import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { clearForUser, listForUser, markAllRead, markRead, removeForUser } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's notification feed (personal events + announcements for them).
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { notifications, unread } = await listForUser(s.uid);
  return NextResponse.json({ notifications, unread });
}

// Feed actions:
//   { action: "read", id }  { action: "readAll" }  { action: "delete", id }  { action: "clear" }
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "read");
  const id = String(b.id || "");

  if (action === "readAll") await markAllRead(s.uid);
  else if (action === "clear") await clearForUser(s.uid);
  else if (action === "delete") {
    if (!id) return NextResponse.json({ error: "Missing notification." }, { status: 400 });
    await removeForUser(s.uid, id);
  } else if (action === "read") {
    if (!id) return NextResponse.json({ error: "Missing notification." }, { status: 400 });
    await markRead(s.uid, id);
  } else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const { notifications, unread } = await listForUser(s.uid);
  return NextResponse.json({ notifications, unread });
}
