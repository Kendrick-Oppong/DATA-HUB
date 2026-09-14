import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { findUserById } from "@/lib/server/users";
import { getWallet } from "@/lib/server/wallet";
import { normalizeGhPhone } from "@/lib/server/phone";
import { generateCode, storeCode } from "@/lib/server/otp";
import { sendEmail, otpEmail } from "@/lib/server/email";
import { MIN_WITHDRAW, MAX_WITHDRAW } from "@/lib/server/withdrawals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NETWORKS = ["mtn", "telecel", "atigo"];

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return email;
  const head = u.length <= 2 ? u[0] : u.slice(0, 2);
  return `${head}${"*".repeat(Math.max(2, u.length - 2))}@${d}`;
}

// Step 1 of a withdrawal: validate the amount + payout number against the live wallet
// balance, then email a one-time code that authorizes the actual payout. Nothing moves
// yet — the wallet is only debited once the code is confirmed (see the confirm route).
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const me = await findUserById(s.uid);
    if (!me) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const amount = Math.round(Number(b.amount) * 100) / 100;
    const network = String(b.network || "");
    const phone = normalizeGhPhone(String(b.momoNumber || ""));
    // The name the payout number is registered to. Carried on the payout record and shown
    // back to the agent before they approve, so a wrong destination is caught by a human
    // before any money moves.
    const momoName = String(b.momoName || "").trim().replace(/\s+/g, " ").slice(0, 80);

    if (!NETWORKS.includes(network))
      return NextResponse.json({ error: "Choose the mobile money network." }, { status: 400 });
    if (!phone)
      return NextResponse.json({ error: "Enter a valid mobile money number." }, { status: 400 });
    if (momoName.length < 2)
      return NextResponse.json({ error: "Enter the name on the mobile money account." }, { status: 400 });
    if (!amount || Number.isNaN(amount) || amount < MIN_WITHDRAW)
      return NextResponse.json({ error: `Minimum withdrawal is ₵${MIN_WITHDRAW}.` }, { status: 400 });
    if (amount > MAX_WITHDRAW)
      return NextResponse.json({ error: `Withdrawals are limited to ₵${MAX_WITHDRAW} at a time.` }, { status: 400 });

    const { balance } = await getWallet(s.uid);
    if (amount > balance)
      return NextResponse.json({ error: "That's more than your wallet balance." }, { status: 400 });

    if (!me.email)
      return NextResponse.json({ error: "Add an email to your profile to confirm withdrawals." }, { status: 400 });

    // Park the validated payout details in the OTP record — the confirm step uses these,
    // not the client's, so the amount/destination can't be swapped after verification.
    const code = generateCode();
    await storeCode(me.phone.intl, "withdraw", code, { amount, momoNumber: phone.local, network, momoName });

    const ttl = process.env.OTP_TTL_MINUTES || "10";
    const mail = otpEmail(code, "withdraw", ttl);
    const sent = await sendEmail(me.email, mail.subject, mail.text, mail.html);
    if (!sent.ok)
      return NextResponse.json({ error: sent.error || "Could not send the code. Try again." }, { status: 502 });

    return NextResponse.json({ ok: true, sentTo: maskEmail(me.email), dev: sent.dev || false });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
