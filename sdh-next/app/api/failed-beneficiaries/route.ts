import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById, requireAdmin } from "@/lib/server/users";
import { strictLocalGhPhone } from "@/lib/server/phone";
import {
  FailedBeneficiaryDoc,
  createFailedBeneficiary,
  listFailedBeneficiaries,
  newFailedBeneficiaryId,
  publicFailedBeneficiary,
} from "@/lib/server/failedBeneficiaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cap on one bulk submission. Comfortably above a bad day's failures, low enough that a
// paste accident can't write thousands of rows.
const MAX_BULK = 200;

// GET /api/failed-beneficiaries — ADMIN ONLY. The whole tracker, with filters.
//
// Query params: ?status=pending|resolved|all &phone=024 &q=text &from=<ms> &to=<ms>
// Agents never read this list: it holds other agents' customers, so it's admin-only by
// design — an agent's own reports go in and are actioned by an admin.
export async function GET(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const me = await requireAdmin(s.uid);
  if (!me) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const url = new URL(req.url);
  const num = (k: string) => {
    const v = Number(url.searchParams.get(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };

  const rows = await listFailedBeneficiaries({
    status: (url.searchParams.get("status") as any) || "all",
    phone: url.searchParams.get("phone") || "",
    q: url.searchParams.get("q") || "",
    from: num("from"),
    to: num("to"),
  });

  // `repeat` counts across the FILTERED set the admin is looking at, so the number shown
  // always matches what's on screen.
  const items = rows.map((r) => publicFailedBeneficiary(r, rows));
  return NextResponse.json({
    items,
    counts: {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      resolved: items.filter((i) => i.status === "resolved").length,
    },
  });
}

// POST /api/failed-beneficiaries — an AGENT reporting a number they saw fail, or an ADMIN
// adding one by hand. Customers can't report: they don't see provider error text.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    if (s.role !== "admin" && s.role !== "reseller")
      return NextResponse.json({ error: "Agents and admins only." }, { status: 403 });

    const b = await req.json().catch(() => ({}));

    // One number or many. An agent hitting the beneficiary error usually has a batch of
    // them — a day's worth of failures — so `phoneNumbers` takes a list in a single request
    // instead of one round trip per number. `phoneNumber` still works unchanged.
    const raw: string[] = Array.isArray(b.phoneNumbers)
      ? b.phoneNumbers.map((x: any) => String(x || ""))
      : [String(b.phoneNumber || b.phone || "")];
    if (!raw.length)
      return NextResponse.json({ error: "Enter at least one number." }, { status: 400 });
    if (raw.length > MAX_BULK)
      return NextResponse.json({ error: `Send at most ${MAX_BULK} numbers at a time.` }, { status: 400 });

    // Same strict local format used elsewhere: 10 digits starting with 0. The number is
    // going to be handed to MTN as-is, so a mistyped or +233-prefixed entry is refused
    // rather than silently rewritten.
    //
    // Deduped WITHIN this submission only — the same number pasted twice in one batch is a
    // typo, but the same number reported again tomorrow is real signal that it still isn't
    // fixed, which is why the table itself never de-dupes.
    const seen = new Set<string>();
    const phones: string[] = [];
    const invalid: string[] = [];
    for (const entry of raw) {
      const ok = strictLocalGhPhone(entry);
      if (!ok) { if (String(entry || "").trim()) invalid.push(String(entry).trim()); continue; }
      if (seen.has(ok)) continue;
      seen.add(ok);
      phones.push(ok);
    }

    if (!phones.length)
      return NextResponse.json(
        { error: "Enter each number as 10 digits starting with 0 — e.g. 0509379146." },
        { status: 400 }
      );

    // A manual report is, by definition, the beneficiary error — the reporter is submitting
    // it from a form that exists for nothing else, so there's no longer anything to pick and
    // nothing to validate. The stored wording is fixed here rather than taken from the
    // client: `errorMessage` still has to satisfy isBeneficiaryError() so a manual row is
    // indistinguishable from an automatic capture to anything that re-filters the table.
    const errorMessage = "Reported by user — not in the beneficiary list";

    // Resolve the reporter's display name once, at write time, so the tracker still reads
    // correctly if the account is later renamed or removed.
    let addedByName = s.role === "admin" ? "Admin" : "Agent";
    try {
      const u = await findUserById(s.uid);
      addedByName = String((u as any)?.business || (u as any)?.name || addedByName);
    } catch {}

    const now = Date.now();
    const note = String(b.note || "").trim().slice(0, 500);
    const orderRef = String(b.orderRef || "").trim() || null;
    const net = String(b.net || "mtn");

    const docs: FailedBeneficiaryDoc[] = phones.map((phoneNumber) => ({
      id: newFailedBeneficiaryId(),
      phoneNumber,
      errorMessage,
      note,
      // An order reference only identifies ONE failure, so it can't be smeared across a
      // batch — it's kept only when a single number was sent (the report-from-order button).
      orderRef: phones.length === 1 ? orderRef : null,
      net,
      addedByUserId: s.uid,
      addedByRole: s.role === "admin" ? "admin" : "agent",
      addedByName,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }));

    // Written one at a time on purpose: a single bad row must not lose the rest of the
    // batch, and the agent is told exactly how many landed.
    const added: FailedBeneficiaryDoc[] = [];
    for (const doc of docs) {
      try { await createFailedBeneficiary(doc); added.push(doc); }
      catch (e: any) { console.error("Failed-beneficiary write error:", e?.message); }
    }
    if (!added.length)
      return NextResponse.json({ error: "Could not save the numbers. Please try again." }, { status: 500 });

    return NextResponse.json({
      item: publicFailedBeneficiary(added[0]),          // unchanged for single-number callers
      items: added.map((d) => publicFailedBeneficiary(d)),
      added: added.length,
      invalid,                                          // echoed back so the UI can name them
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
