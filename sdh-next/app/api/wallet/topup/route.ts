import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { initialize, paystackMode } from "@/lib/server/providers/paystack";
import { createPendingTopup, newTopupRef } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_TOPUP = 1;
const MAX_TOPUP = 10000;

// Start a wallet top-up: create a pending payment and hand back Paystack's hosted
// checkout URL. The wallet is NOT credited here — only after Paystack confirms the
// payment (webhook / callback verify). The client redirects the browser to the URL.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    if (paystackMode() === "dry")
      return NextResponse.json({ error: "Payments aren't configured yet. Please try again later." }, { status: 503 });

    const b = await req.json().catch(() => ({}));
    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!amount || Number.isNaN(amount) || amount < MIN_TOPUP)
      return NextResponse.json({ error: `Enter an amount of at least ₵${MIN_TOPUP}.` }, { status: 400 });
    if (amount > MAX_TOPUP)
      return NextResponse.json({ error: `Top-ups are limited to ₵${MAX_TOPUP} at a time.` }, { status: 400 });

    // Paystack needs an email; fall back to a synthetic one if the user has none.
    const user = await findUserById(s.uid);
    const email = (user?.email && String(user.email)) || `${user?.phone?.local || s.uid}@wallet.smartdatahub.gh`;

    const reference = newTopupRef(s.uid);
    await createPendingTopup({ reference, userId: s.uid, amountGhs: amount, email });

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const origin = (process.env.APP_BASE_URL || `${proto}://${host}`).replace(/\/+$/, "");

    const init = await initialize({
      email,
      amountGhs: amount,
      reference,
      callbackUrl: `${origin}/api/wallet/topup/callback`,
      metadata: { userId: s.uid, purpose: "wallet_topup" },
    });
    if (!init.ok)
      return NextResponse.json({ error: init.error || "Could not start payment." }, { status: 502 });

    return NextResponse.json({ authorizationUrl: init.authorizationUrl, reference });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
