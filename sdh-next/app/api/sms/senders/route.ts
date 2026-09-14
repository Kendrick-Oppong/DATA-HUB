import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { listSenderIdsByUser, platformSenderOption, publicSenderId, requestSenderId } from "@/lib/server/senderIds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The sender IDs this account can pick from: the shared platform one, plus their own
// requests (whatever their status, so a pending or rejected one is visible with its reason).
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const own = await listSenderIdsByUser(s.uid);
  return NextResponse.json({ senders: [platformSenderOption(), ...own.map(publicSenderId)] });
}

// Request a new sender ID. It only becomes usable once an admin has registered it with
// Arkesel and approved it here.
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const user = await findUserById(s.uid);
  const r = await requestSenderId({ id: s.uid, name: user?.name }, String(b.name || ""));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  const own = await listSenderIdsByUser(s.uid);
  return NextResponse.json({ sender: publicSenderId(r.sender), senders: [platformSenderOption(), ...own.map(publicSenderId)] });
}
