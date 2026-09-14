import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getStoreByUserId, saveStore } from "@/lib/server/stores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in agent's own store config (branding, prices, toggles).
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const doc = await getStoreByUserId(s.uid);
  return NextResponse.json({ store: doc ? doc.config : null });
}

// Create/update the agent's store. Body is the client `store` object (must include `handle`).
export async function PUT(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const config = await req.json().catch(() => null);
  if (!config || typeof config !== "object")
    return NextResponse.json({ error: "Invalid store data." }, { status: 400 });

  const res = await saveStore(s.uid, config);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ store: res.store.config });
}

// Same as PUT — some clients prefer POST for upserts.
export const POST = PUT;
