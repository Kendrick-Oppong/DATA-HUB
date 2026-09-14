import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { strictLocalGhPhone } from "@/lib/server/phone";
import { spend } from "@/lib/server/wallet";
import { validateGhanaCard } from "@/lib/server/ghanaCard";
import { priceAfa } from "@/lib/server/afaPricing";
import {
  AfaRegistrationDoc,
  announceAfaApplied,
  cardAlreadyRegistered,
  createAfaRegistration,
  listAfaByUser,
  newAfaRef,
  publicAfa,
} from "@/lib/server/afa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's own AFA registrations, plus the current admin-set price so the form
// can show what it will charge.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const [list, priced] = await Promise.all([listAfaByUser(s.uid), priceAfa()]);
  return NextResponse.json({ registrations: list.map((r) => publicAfa(r)), price: priced.price });
}

// Submit an AFA registration, paid from the wallet.
//
// The price is ALWAYS the admin-set one — there is no agent rate and no client-supplied
// amount, so an agent and a customer pay exactly the same and neither can change it. No
// commission is earned: AFA is not a reseller product.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const name = String(b.name || "").trim();
    // AFA numbers must be local form (0XXXXXXXXX) exactly — +233/233 is refused, not rewritten.
    const phone = strictLocalGhPhone(String(b.phone || b.recipient || ""));
    const location = String(b.location || "").trim();
    const occupation = String(b.occupation || b.profession || "").trim();
    const dob = String(b.dob || "").trim();

    if (!name) return NextResponse.json({ error: "Enter the applicant's full name." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Enter the MTN number as 10 digits starting with 0 — e.g. 0509379146." }, { status: 400 });
    if (!location) return NextResponse.json({ error: "Enter the applicant's location." }, { status: 400 });
    if (!occupation) return NextResponse.json({ error: "Enter the applicant's occupation." }, { status: 400 });
    if (!dob) return NextResponse.json({ error: "Enter the applicant's date of birth." }, { status: 400 });

    // Ghana Card — validated and canonicalised server-side, so a tampered client can't slip
    // a malformed or obviously fake number past the form's own check.
    const card = validateGhanaCard(String(b.ghanaCard || b.idNum || ""));
    if (!card.ok) return NextResponse.json({ error: card.error }, { status: 400 });
    if (await cardAlreadyRegistered(card.formatted!))
      return NextResponse.json(
        { error: "That Ghana Card already has an AFA registration with us." },
        { status: 409 }
      );

    const { price } = await priceAfa();
    const ref = newAfaRef();

    // Charge the wallet first — the authoritative overdraft check.
    const debit = await spend(s.uid, { amount: price, ref, note: `MTN AFA registration · ${phone}` });
    if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });

    const now = Date.now();
    const registration: AfaRegistrationDoc = {
      ref,
      userId: s.uid,
      storeHandle: null,
      role: s.role,
      name,
      phone,
      ghanaCard: card.formatted!,
      location,
      occupation,
      dob,
      amount: price,
      pay: "Wallet",
      status: "pending",
      at: now,
      updatedAt: now,
    };
    await createAfaRegistration(registration);
    await announceAfaApplied(registration);

    return NextResponse.json({ registration: publicAfa(registration), balance: debit.balance });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
