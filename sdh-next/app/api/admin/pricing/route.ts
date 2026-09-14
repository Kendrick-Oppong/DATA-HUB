import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { getDataPricing, saveDataPricing } from "@/lib/server/pricingStore";
import { getCheckerPricing, saveCheckerPricing } from "@/lib/server/checkerPricing";
import { getSmsPricing, saveSmsPricing } from "@/lib/server/smsPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — the published data-bundle pricing (per network + AT iShare/BigTime). Airtime has
// nothing to price: it sells at face value and Muviin settles our commission separately.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  return NextResponse.json({ pricing: await getDataPricing(), checkers: await getCheckerPricing(), sms: await getSmsPricing() });
}

// Admin — publish new pricing. Takes effect everywhere (real charges price from this store).
// Accepts `{ pricing }` (data bundles, or a bare bundle table — the legacy shape), and/or
// `{ checkers }`, and/or `{ sms }`. Each can be published on its own; whatever is absent is
// left untouched.
export async function PUT(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (Array.isArray(b.checkers)) await saveCheckerPricing(b.checkers);
  if (b.sms && typeof b.sms === "object") await saveSmsPricing(b.sms);
  // A bare body is the legacy "bundle table at the top level" shape; recognise it by a
  // network key so a checkers- or SMS-only publish is never mistaken for an empty bundle table.
  const table = b.pricing || (b.mtn || b.mtn_xpress || b.telecel || b.atigo_ishare || b.atigo_bigtime ? b : null);
  const pricing = table ? await saveDataPricing(table) : await getDataPricing();
  return NextResponse.json({ pricing, checkers: await getCheckerPricing(), sms: await getSmsPricing() });
}
