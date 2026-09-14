import { NextResponse } from "next/server";
import { getWebhookEvents } from "@/lib/server/db";
import { getCheckerOrderByRef, fulfillCheckerOrder } from "@/lib/server/checkerOrders";
import { getOrderByRef, applyStatus } from "@/lib/server/orders";
import { airtimeStatus, checkerStatus } from "@/lib/server/providers/muviin";
import { isInFlight } from "@/lib/orderStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Muviin callback. Register on their portal (Configure a webhook → Callback URL):
//   https://<your-domain>/api/webhooks/muviin?token=<MUVIIN_WEBHOOK_SECRET>
//
// WHAT THIS IS FOR
// Muviin's documented API returns the voucher batch_ref but NEVER the PIN + serial, which is
// why checker fulfilment has been manual. If their callback carries the voucher details, this
// closes the loop and delivers automatically. If it only announces a status change, it still
// settles airtime faster — and either way EVERY payload is recorded verbatim below, so we can
// read what they actually send instead of guessing.
//
// TRUST MODEL — deliberately split, because the two things have different consequences:
//   • STATUS is never taken from the body. We re-ask Muviin's own API what the state is and
//     act on that, exactly as the GHDataConnect callback does. A forged POST must not be able
//     to mark an order delivered, pay commission and close it.
//   • PIN + SERIAL can only come from the body — no endpoint exposes them — so they ARE read
//     from the payload, but only after the shared secret checks out AND Muviin's own API
//     confirms that batch really succeeded. Set MUVIIN_WEBHOOK_SECRET; without it this route
//     will record payloads but refuse to fulfil anything.
//
// Idempotent: fulfillCheckerOrder and applyStatus each deliver at most once, so retries and
// duplicate deliveries are safe.

function verify(req: Request): boolean {
  const secret = process.env.MUVIIN_WEBHOOK_SECRET || "";
  if (!secret) return true; // not configured → accept, but see canFulfil() below
  return (new URL(req.url).searchParams.get("token") || "") === secret;
}
// Acting on a payload requires a configured secret. Recording one does not.
const canFulfil = () => !!process.env.MUVIIN_WEBHOOK_SECRET;

// Keep the raw payload whatever it is. This is the whole point on the first delivery.
async function record(kind: string, body: any, url: URL, note?: string): Promise<void> {
  try {
    const events = await getWebhookEvents();
    await events.insertOne({
      provider: "muviin",
      kind,
      note: note || null,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      at: Date.now(),
    });
  } catch (e: any) {
    console.error("Muviin webhook record failed:", e?.message);
  }
  // Also to the server log, so it's visible without a DB round trip.
  console.log(`[muviin webhook] ${kind}${note ? " · " + note : ""}`, JSON.stringify(body).slice(0, 2000));
}

// Walk any nested shape looking for a key, since the payload format is undocumented.
function deepFind(obj: any, test: (key: string) => boolean, depth = 0): string {
  if (!obj || typeof obj !== "object" || depth > 6) return "";
  for (const [k, v] of Object.entries(obj)) {
    if (test(k) && (typeof v === "string" || typeof v === "number")) {
      const s = String(v).trim();
      if (s && s.toLowerCase() !== "null") return s;
    }
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = deepFind(v, test, depth + 1);
      if (found) return found;
    }
  }
  return "";
}

const findRef = (b: any, url: URL) =>
  deepFind(b, (k) => /^(extref|ext_ref|reference|ref)$/i.test(k)) || (url.searchParams.get("extRef") || "").trim();
const findPin = (b: any) => deepFind(b, (k) => /^(pin|voucher_pin|voucherpin|card_pin)$/i.test(k));
const findSerial = (b: any) => deepFind(b, (k) => /^(serial|serial_number|serialnumber|voucher_serial|card_serial)$/i.test(k));

// Muviin's portal pings the URL when you press "Verify and save". Answer anything it sends,
// echoing a challenge if one is present, so the subscription can be saved.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("challenge") || url.searchParams.get("hub.challenge") || "";
  await record("verify-get", null, url);
  if (challenge) return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  try {
    const raw = await req.text();
    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = { _unparsed: raw.slice(0, 4000) }; }

    if (!verify(req)) {
      await record("rejected", body, url, "bad or missing token");
      return NextResponse.json({ error: "Unrecognized sender." }, { status: 401 });
    }

    const ref = findRef(body, url);
    const pin = findPin(body);
    const serial = findSerial(body);
    await record("callback", body, url, `ref=${ref || "?"} pin=${pin ? "yes" : "no"} serial=${serial ? "yes" : "no"}`);

    // Nothing we can match — ack anyway. A non-2xx would only make them retry a payload we
    // still can't read, and it's already recorded for inspection.
    if (!ref) return NextResponse.json({ ok: true, note: "no reference found" });
    if (!canFulfil())
      return NextResponse.json({ ok: true, note: "recorded; MUVIIN_WEBHOOK_SECRET not set so no action taken" });

    // ---- Result-checker order ----
    const checker = await getCheckerOrderByRef(ref);
    if (checker) {
      if (!pin || !serial) {
        // The callback fired but carries no voucher — the manual desk still owns this one.
        return NextResponse.json({ ok: true, note: "checker callback carried no pin/serial" });
      }
      // Confirm with Muviin's own API that this batch really succeeded before delivering.
      const st = await checkerStatus(ref);
      if (!st.ok || st.status !== "delivered")
        return NextResponse.json({ ok: true, note: "provider has not confirmed this batch" });

      const res = await fulfillCheckerOrder(ref, pin, serial);
      return NextResponse.json({ ok: true, delivered: res.ok });
    }

    // ---- Airtime order ----
    const order = await getOrderByRef(ref);
    if (order && order.provider === "muviin" && isInFlight(order.status)) {
      const st = await airtimeStatus(ref);
      if (st.ok) await applyStatus(ref, st.status);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, note: "reference did not match an open order" });
  } catch (e: any) {
    console.error("Muviin webhook error:", e?.message);
    // Ack: a 500 invites retries of something we've already recorded.
    return NextResponse.json({ ok: true });
  }
}
