import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getDataPricing, PRICING_KEYS } from "@/lib/server/pricingStore";
import { getCheckerPricing } from "@/lib/server/checkerPricing";
import { getSmsPricing, smsSellRate } from "@/lib/server/smsPricing";
import { supplierPriceFor } from "@/lib/server/pricing";
import { monthlyBlended, tierBonus } from "@/lib/server/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Every published line, including the ones a network splits into (MTN standard/Xpress,
// AT iShare/BigTime). Taken from the store so a new line can't be added there and silently
// left out of what the buy screen is served.
const KEYS = PRICING_KEYS;

// `supplier` is what Muviin charges US — admin-only. `cost` is the agent's price, sent to
// agents and admins only, exactly as `wholesale` is for data bundles.
//
// `unit` is what THIS account is actually charged per voucher, resolved here with the same
// rule priceChecker() uses (agents pay `cost`, everyone else `retail`). It goes to EVERY
// audience, because the buy screen must never work the price out for itself: it used to do
// `isAgent ? product.cost : product.retail` against a payload where `cost` is withheld from
// unprivileged callers, so an agent whose pricing fetch went out without a readable cookie
// was quoted RETAIL and then charged the lower agent price. Sending a finished figure keeps
// the agent's margin hidden from guests while still being unambiguous about the charge.
function checkersFor(rows: any[], s: any, privileged: boolean) {
  const atCost = s?.role === "reseller";   // the only role priceChecker discounts
  return rows.map(({ supplier, cost, ...c }: any) => {
    const unit = atCost ? cost : c.retail;
    return s?.role === "admin"
      ? { ...c, unit, cost, supplier }
      : privileged
        ? { ...c, unit, cost }
        : { ...c, unit };
  });
}

// What THIS account will actually be charged for a bundle, resolved server-side with the
// same rule the buy routes price with (priceBundle: wholesale for an agent, retail for
// everyone else — customers, admins and guests alike).
//
// This is sent as a finished amount so the client never re-derives the price from its own
// idea of the role. It used to, and the two could disagree: the client's role comes from
// localStorage/`/api/auth/me` while the charge comes from the session cookie, and
// `wholesale` is omitted from this response for anyone unprivileged — so an agent whose
// pricing fetch went out without a readable cookie was shown RETAIL as "your wholesale
// cost" and then charged the real, lower wholesale by Paystack.
//
// NOTE `atWholesale` is deliberately NOT `privileged`: an admin is privileged (they get to
// see `wholesale`) but priceBundle only discounts role === "reseller", so an admin is
// charged retail and must be shown retail.
const withCost = (rows: any[], atWholesale: boolean) =>
  rows.map((b) => ({ ...b, cost: atWholesale && typeof b.wholesale === "number" ? b.wholesale : b.retail }));

// PUBLIC — the live published data-bundle pricing, so the customer buy screen and agent
// storefront display the same prices admins publish. Retail prices aren't secret, but two
// parts of the doc are held back:
//   - `vendor` (our provider cost reference) — admin-only, no client consumer; the admin
//     Pricing page reads it from /api/admin/pricing.
//   - `wholesale` — only sent to agents/admins, who display it (their cost + margin). A guest
//     on an agent's public storefront would otherwise be able to work out that agent's margin
//     on every bundle. Role comes from the session cookie, which /api/auth/me keeps in sync
//     with the live DB role — the same source the buy flow prices from.
export async function GET() {
  const full = await getDataPricing();
  const { vendor, ...pricing } = full;
  const checkerRows = await getCheckerPricing();
  const s = readSession();
  const privileged = !!s && (s.role === "reseller" || s.role === "admin");
  const atWholesale = s?.role === "reseller";   // the only role priceBundle discounts
  // Bulk SMS: the per-page rate only. Our supplier cost and the markup on it stay on the
  // server — the sell rate is not secret, but what we pay Arkesel is, exactly as `vendor`
  // and `wholesale` are held back on data bundles.
  const smsRate = smsSellRate(await getSmsPricing());

  // Per-bundle TIER BONUS for an agent (31 Jul 2026 §4: the buy screen must show the bonus,
  // not the agent's own margin). Computed here and sent as a finished amount — the vendor
  // price it derives from stays server-side, so showing an agent what they earn never
  // discloses what the platform pays.
  if (privileged && s) {
    try {
      const { tier } = await monthlyBlended(s.uid);
      for (const k of KEYS) {
        pricing[k] = withCost(
          (pricing[k] || []).map((b: any) => ({
            ...b,
            tierBonus: tierBonus(b.wholesale, supplierPriceFor(full, k, b.gb, b.noExpiry), tier.rate),
          })),
          atWholesale
        );
      }
      return NextResponse.json({ pricing, checkers: checkersFor(checkerRows, s, privileged), smsRate, tier: { id: tier.id, name: tier.name, rate: tier.rate } });
    } catch (e: any) {
      console.error("Tier bonus pricing failed, sending prices without it:", e?.message);
    }
  }

  const checkers = checkersFor(checkerRows, s, privileged);

  if (privileged) {
    for (const k of KEYS) pricing[k] = withCost(pricing[k] || [], atWholesale);
    return NextResponse.json({ pricing, checkers, smsRate });
  }

  // Unprivileged: `wholesale` is stripped, but `cost` still ships — it's retail for this
  // audience anyway, and the buy screen must never have to infer the charge itself.
  const out: any = { updatedAt: pricing.updatedAt };
  for (const k of KEYS) out[k] = withCost(pricing[k] || [], false).map(({ wholesale, ...b }) => b);
  return NextResponse.json({ pricing: out, checkers, smsRate });
}
