import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import {
  audienceCount,
  createBroadcast,
  deleteBroadcast,
  emailBroadcast,
  listBroadcasts,
  NotifAudience,
} from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCES: NotifAudience[] = ["all", "agents", "customers"];

// Admin — announcements already sent, plus the live size of each audience.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [broadcasts, all, agents, customers] = await Promise.all([
    listBroadcasts(),
    audienceCount("all"),
    audienceCount("agents"),
    audienceCount("customers"),
  ]);
  return NextResponse.json({ broadcasts, counts: { all, agents, customers } });
}

// Admin — send an announcement, or withdraw one:
//   { title, body, audience: "all"|"agents"|"customers", link?, email? }
//   { action: "delete", id }
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));

  if (String(b.action || "") === "delete") {
    const id = String(b.id || "");
    if (!id) return NextResponse.json({ error: "Missing announcement." }, { status: 400 });
    const ok = await deleteBroadcast(id);
    if (!ok) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    return NextResponse.json({ broadcasts: await listBroadcasts() });
  }

  const title = String(b.title || "").trim();
  const body = String(b.body || "").trim();
  const audience = (AUDIENCES.includes(b.audience) ? b.audience : "all") as NotifAudience;
  if (!title) return NextResponse.json({ error: "Add a title." }, { status: 400 });
  if (!body) return NextResponse.json({ error: "Write your message." }, { status: 400 });

  const doc = await createBroadcast({
    audience,
    title,
    body,
    by: String(me.name || "Support"),
    link: b.link ? String(b.link) : null,
  });

  // Optionally also email everyone in the audience (best-effort; the in-app message is
  // already delivered either way).
  const emailed = b.email ? await emailBroadcast(audience, title, body) : 0;

  return NextResponse.json({
    broadcast: { id: doc.id, title: doc.title, body: doc.body, audience, by: doc.by, at: doc.at },
    recipients: await audienceCount(audience),
    emailed,
    broadcasts: await listBroadcasts(),
  });
}
