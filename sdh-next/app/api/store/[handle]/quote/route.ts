import { NextResponse } from "next/server";
import { getStoreByHandle } from "@/lib/server/stores";
import { priceStoreData } from "@/lib/server/pricing";
import { normalizeLine, type ProductLine } from "@/lib/server/providers/lines";
import { supportedNetwork } from "@/lib/server/providers/data";
import { findPromo, discountFor, capDiscount } from "@/lib/server/promos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC — no auth, no side effects. Price a bundle (optionally with a discount code) exactly
// the way /pay will charge it, so the checkout can display the real total instead of guessing.
//
// The guest can't work this out themselves: a code is capped at the agent's margin, and the
// margin depends on the wholesale, which we deliberately never send to guests. So the total
// has to come from here, or the customer sees one price and pays another.
export async function POST(req: Request, { params }: { params: { handle: string } }) {
  try {
    const storeDoc = await getStoreByHandle(params.handle);
    if (!storeDoc) return NextResponse.json({ error: "Store not found." }, { status: 404 });
    const config = storeDoc.config || {};

    const b = await req.json().catch(() => ({}));
    const net = String(b.net || "");
    const atProduct: ProductLine | undefined = normalizeLine(net, b.atProduct) ?? undefined;

    if (!supportedNetwork(net, atProduct)) return NextResponse.json({ error: "Unsupported network." }, { status: 400 });

    const priced = await priceStoreData(config, net, atProduct, Number(b.capacityGb));
    if (!priced || priced.sell <= 0) return NextResponse.json({ error: "Choose a valid bundle." }, { status: 400 });

    const raw = String(b.promoCode || "").trim();
    const promo = raw ? findPromo(config, raw, net) : null;
    if (raw && !promo) return NextResponse.json({ error: "That code isn't valid for this item." }, { status: 400 });

    const discount = promo ? capDiscount(discountFor(promo, priced.sell), priced.sell, priced.wholesale) : 0;
    const payable = Math.round((priced.sell - discount) * 100) / 100;

    // `wholesale` is deliberately absent — a guest must not be able to derive the agent's margin.
    return NextResponse.json({ sell: priced.sell, discount, payable, pkg: priced.pkg, code: promo ? promo.code : null });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
