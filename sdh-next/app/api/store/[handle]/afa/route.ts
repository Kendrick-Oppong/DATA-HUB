import { NextResponse } from "next/server";
import { getStoreByHandle } from "@/lib/server/stores";
import { normalizeGhPhone, strictLocalGhPhone } from "@/lib/server/phone";
import { initialize, paystackMode } from "@/lib/server/providers/paystack";
import { validateGhanaCard } from "@/lib/server/ghanaCard";
import { priceAfaForStore } from "@/lib/server/afaPricing";
import { cardAlreadyRegistered } from "@/lib/server/afa";
import { createPendingAfaPayment, newAfaPayRef } from "@/lib/server/afaPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC — no auth. Start a mobile-money payment for an AFA registration submitted from an
// agent's storefront.
//
// The fee is the ADMIN-set price, never anything the store or the client supplies: agents
// can't price AFA and earn no commission on it, so there's no per-store amount to look up.
// The registration is only created once Paystack confirms (see afaPayments.ts).
export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  // Lets the storefront show the real fee before anyone fills the form in.
  const storeDoc = await getStoreByHandle(params.handle);
  if (!storeDoc) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  // The AGENT's price — what a guest on this store actually pays.
  const { sell, fee } = await priceAfaForStore(storeDoc.config || {});
  return NextResponse.json({ price: sell, fee, open: (storeDoc.config || {}).open !== false });
}

export async function POST(req: Request, { params }: { params: { handle: string } }) {
  try {
    if (paystackMode() === "dry")
      return NextResponse.json({ error: "Payments aren't available right now. Please try again later." }, { status: 503 });

    const storeDoc = await getStoreByHandle(params.handle);
    if (!storeDoc) return NextResponse.json({ error: "Store not found." }, { status: 404 });
    const config = storeDoc.config || {};
    if (config.open === false)
      return NextResponse.json({ error: "This store is currently closed." }, { status: 409 });

    const b = await req.json().catch(() => ({}));
    const name = String(b.name || "").trim();
    // AFA numbers must be local form (0XXXXXXXXX) exactly — +233/233 is refused, not rewritten.
    const phone = strictLocalGhPhone(String(b.phone || b.recipient || ""));
    const location = String(b.location || "").trim();
    const occupation = String(b.occupation || b.profession || "").trim();
    const dob = String(b.dob || "").trim();
    const payer = normalizeGhPhone(String(b.payerPhone || ""));

    if (!name) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Enter the MTN number as 10 digits starting with 0 — e.g. 0509379146." }, { status: 400 });
    if (!location) return NextResponse.json({ error: "Enter your location." }, { status: 400 });
    if (!occupation) return NextResponse.json({ error: "Enter your occupation." }, { status: 400 });
    if (!dob) return NextResponse.json({ error: "Enter your date of birth." }, { status: 400 });

    const card = validateGhanaCard(String(b.ghanaCard || b.idNum || ""));
    if (!card.ok) return NextResponse.json({ error: card.error }, { status: 400 });
    if (await cardAlreadyRegistered(card.formatted!))
      return NextResponse.json(
        { error: "That Ghana Card already has an AFA registration with us." },
        { status: 409 }
      );

    // Priced from the AGENT's store config, floored at our fee — never trusted from the
    // client, so a tampered request can't register for less than the platform charges.
    const { sell: price, fee, profit } = await priceAfaForStore(config);
    if (price <= 0) return NextResponse.json({ error: "AFA registration isn't available right now." }, { status: 503 });

    // Paystack needs an email; a guest has none, so synthesize one from the number.
    const email = `${phone}@guest.sdhghana.com`;
    const reference = newAfaPayRef(storeDoc.handle);

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");
    const callbackUrl = `${origin}/api/store/${encodeURIComponent(storeDoc.handle)}/afa/callback`;

    await createPendingAfaPayment({
      reference,
      handle: storeDoc.handle,
      amountGhs: price,
      fee,
      agentProfit: profit,
      agentUserId: storeDoc.userId || null,
      name,
      phone,
      ghanaCard: card.formatted!,
      location,
      occupation,
      dob,
      email,
      payerPhone: payer ? payer.local : null,
    });

    const init = await initialize({
      email,
      amountGhs: price,
      reference,
      callbackUrl,
      metadata: { kind: "afa", handle: storeDoc.handle, phone },
    });
    if (!init.ok) return NextResponse.json({ error: init.error }, { status: 502 });

    return NextResponse.json({ authorizationUrl: init.authorizationUrl, reference, amount: price });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
