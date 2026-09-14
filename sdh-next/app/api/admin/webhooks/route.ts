import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { queryWebhookEvents } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — the most recent raw webhook payloads a provider has sent us.
//
// Exists so an undocumented callback can be inspected without a database client: register the
// URL, trigger a delivery, then read here exactly what arrived. That's how we determine
// whether Muviin's callback carries the voucher PIN + serial.
export async function GET(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const provider = new URL(req.url).searchParams.get("provider") || "";
  const events = await queryWebhookEvents(provider ? { provider } : {});
  return NextResponse.json({ events });
}
