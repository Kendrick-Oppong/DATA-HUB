import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { smsBalance } from "@/lib/server/arkesel";
import { listAllSenderIds, publicSenderId, setSenderIdStatus } from "@/lib/server/senderIds";
import { listAllSmsCampaigns, publicSmsCampaign } from "@/lib/server/smsCampaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — every sender ID request, every campaign sent on the platform, and our own
// remaining credit with Arkesel. The balance is best-effort: a provider outage must still
// leave the approvals queue usable.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [senders, campaigns, balance] = await Promise.all([
    listAllSenderIds(),
    listAllSmsCampaigns(),
    smsBalance().catch(() => ({ ok: false, units: 0, cash: null, error: "Balance unavailable" })),
  ]);

  return NextResponse.json({
    senders: senders.map(publicSenderId),
    campaigns: campaigns.map(publicSmsCampaign),
    balance,
  });
}

// Admin — approve or reject a sender ID request.
//
// Approving here does NOT register the name with Arkesel: they have no API for it, so the
// name must first be submitted on the Arkesel dashboard and cleared by the telcos. This
// only records that it's been done, which is what lets an agent select it.
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (b.action !== "senderStatus") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const r = await setSenderIdStatus(String(b.ref || ""), b.status, s.uid, b.note ? String(b.note) : undefined);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  const senders = await listAllSenderIds();
  return NextResponse.json({ sender: publicSenderId(r.sender), senders: senders.map(publicSenderId) });
}
