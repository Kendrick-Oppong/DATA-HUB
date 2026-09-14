import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/server/providers/paystack";
import { creditTopup } from "@/lib/server/payments";
import { fulfillOrderPayment, isOrderPayRef } from "@/lib/server/orderPayments";
import { fulfillStoreOrderPayment, isStoreOrderPayRef } from "@/lib/server/storeOrderPayments";
import { fulfillAfaPayment, isAfaPayRef } from "@/lib/server/afaPayments";
import { settleWithdrawalByTransfer } from "@/lib/server/withdrawals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Paystack payment webhook — the source of truth for crediting wallet top-ups.
// We require a valid HMAC-SHA512 signature (x-paystack-signature) over the raw body,
// then credit the wallet exactly once on `charge.success`. Idempotent: duplicate
// deliveries are absorbed by creditTopup's claim guard.
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!verifySignature(raw, req.headers.get("x-paystack-signature"))) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = {}; }

    // Payout (agent withdrawal) settlement — a transfer we initiated has resolved.
    // transfer.success → mark paid; transfer.failed/reversed → refund the wallet.
    if (typeof body?.event === "string" && body.event.startsWith("transfer.")) {
      await settleWithdrawalByTransfer(String(body?.data?.transfer_code || ""), body.event);
      return NextResponse.json({ ok: true });
    }

    // Only a successful charge credits the wallet. Ack everything else so Paystack
    // doesn't retry events we don't act on.
    if (body?.event !== "charge.success") return NextResponse.json({ ok: true, ignored: body?.event || null });

    const d = body?.data || {};
    const reference = String(d.reference || "");
    const paid = String(d.status || "").toLowerCase() === "success";
    if (!reference || !paid) return NextResponse.json({ ok: true, note: "no-op" });

    const amountGhs = Math.round(Number(d.amount || 0)) / 100; // pesewas → GHS

    // Route by reference: a guest storefront order, a guest AFA registration, a signed-in
    // direct order payment, or a wallet top-up. All fulfillers are idempotent (claim guard)
    // so duplicate deliveries are safe.
    if (isStoreOrderPayRef(reference)) await fulfillStoreOrderPayment(reference);
    else if (isAfaPayRef(reference)) await fulfillAfaPayment(reference);
    else if (isOrderPayRef(reference)) await fulfillOrderPayment(reference);
    else await creditTopup(reference, amountGhs);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
