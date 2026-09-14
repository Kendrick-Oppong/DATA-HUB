import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import { queryUsers } from "@/lib/server/db";
import { listAllAfa, publicAfa, setAfaStatus } from "@/lib/server/afa";
import { getAfaPricing, saveAfaPricing, AFA_MAX_PRICE, AFA_MIN_PRICE } from "@/lib/server/afaPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin — every AFA registration across the platform, plus the admin-set price.
// Admins see the FULL Ghana Card number (they're reviewing it); everyone else gets a mask.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [list, pricing] = await Promise.all([listAllAfa(), getAfaPricing()]);

  // Join the submitter's name for the review desk.
  const names = new Map<string, string>();
  try { for (const u of await queryUsers({})) names.set(String(u._id), u.business || u.name || "User"); } catch {}

  const registrations = list.map((r) => ({
    ...publicAfa(r, { admin: true }),
    submittedBy: r.userId ? names.get(String(r.userId)) || "User" : r.storeHandle ? `Guest · ${r.storeHandle}` : "Guest",
  }));
  return NextResponse.json({ registrations, pricing, limits: { min: AFA_MIN_PRICE, max: AFA_MAX_PRICE } });
}

// Admin actions:
//   { ref, action: "status", status: "approved" | "rejected" | "pending" }
//   { action: "price", price, supplier }   — the ONLY place the AFA fee can be changed
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "status");

  if (action === "price") {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < AFA_MIN_PRICE || price > AFA_MAX_PRICE)
      return NextResponse.json(
        { error: `Enter an AFA price between GH₵${AFA_MIN_PRICE} and GH₵${AFA_MAX_PRICE}.` },
        { status: 400 }
      );
    const pricing = await saveAfaPricing({ price, supplier: b.supplier });
    return NextResponse.json({ pricing });
  }

  const ref = String(b.ref || "");
  if (!ref) return NextResponse.json({ error: "Missing registration reference." }, { status: 400 });

  const status = String(b.status || "");
  if (!["approved", "rejected", "pending"].includes(status))
    return NextResponse.json({ error: "Choose approved, rejected or pending." }, { status: 400 });

  // Notifying the applicant (SMS + email) happens inside setAfaStatus, and only when the
  // status actually changes — so a double-click can't text somebody twice.
  const res = await setAfaStatus(ref, status as any, s.uid);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ registration: publicAfa(res.registration!, { admin: true }) });
}
