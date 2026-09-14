import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requestAgent, findUserById, publicUser } from "@/lib/server/users";
import { notifyAgentApplied } from "@/lib/server/agentNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A signed-in customer applies to become an agent → status "pending" (awaits admin approval).
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const business = String(b.business || "").trim();
  if (!business) return NextResponse.json({ error: "Enter your business or store name." }, { status: 400 });

  const res = await requestAgent(s.uid, business);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  const user = await findUserById(s.uid);
  if (user) await notifyAgentApplied(user);
  return NextResponse.json({ user: publicUser(user) });
}
