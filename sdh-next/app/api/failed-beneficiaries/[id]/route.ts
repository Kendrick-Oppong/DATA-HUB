import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { requireAdmin } from "@/lib/server/users";
import {
  deleteFailedBeneficiary,
  publicFailedBeneficiary,
  setFailedBeneficiaryStatus,
} from "@/lib/server/failedBeneficiaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/failed-beneficiaries/:id — ADMIN ONLY. Mark resolved, or reopen.
//
// Body: { status: "resolved" | "pending" }
// Only an admin can change a report's state: an agent marking their own report resolved
// would hide a number that still hasn't been added upstream.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const status = String(b.status || "");
  if (status !== "resolved" && status !== "pending")
    return NextResponse.json({ error: "Status must be resolved or pending." }, { status: 400 });

  const updated = await setFailedBeneficiaryStatus(params.id, status as any, s.uid);
  if (!updated) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ item: publicFailedBeneficiary(updated) });
}

// DELETE /api/failed-beneficiaries/:id — ADMIN ONLY, per the permissions spec.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const ok = await deleteFailedBeneficiary(params.id);
  if (!ok) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id: params.id });
}
