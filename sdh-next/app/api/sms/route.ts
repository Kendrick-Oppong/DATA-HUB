import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { normalizeGhPhone } from "@/lib/server/phone";
import { spend } from "@/lib/server/wallet";
import { getSmsPricing, priceSmsCampaign, smsPages, smsSellRate } from "@/lib/server/smsPricing";
import { allowedSendersFor } from "@/lib/server/senderIds";
import { listSmsCampaignsByUser, newSmsRef, publicSmsCampaign, runSmsCampaign } from "@/lib/server/smsCampaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One campaign can't exceed this many recipients. Arkesel takes a large batch in a single
// request, but an unbounded list is both a runaway wallet charge and a document big enough
// to matter — anyone sending more than this should be doing it in batches anyway.
const MAX_RECIPIENTS = 2000;
// Longest message we'll accept: 10 GSM pages. Past that the cost per recipient climbs
// steeply and it's almost always a paste gone wrong.
const MAX_PAGES = 10;

// The signed-in account's campaign history + the rate they pay.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const [list, pricing] = await Promise.all([listSmsCampaignsByUser(s.uid), getSmsPricing()]);
  return NextResponse.json({
    campaigns: list.map(publicSmsCampaign),
    rate: smsSellRate(pricing),
  });
}

// Send a bulk SMS campaign, charged to the wallet.
//
// Everything that decides the price is computed HERE — pages from the message body,
// recipients after dedupe, the rate from the admin-published pricing. Nothing about the
// cost is taken from the request.
export async function POST(req: Request) {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const message = String(b.message || "").trim();
  if (!message) return NextResponse.json({ error: "Type a message to send." }, { status: 400 });

  const pages = smsPages(message);
  if (pages > MAX_PAGES) {
    return NextResponse.json({ error: `That message is ${pages} pages — keep it to ${MAX_PAGES} or fewer.` }, { status: 400 });
  }

  // Accept either an array or the pasted textarea blob the composer sends.
  const raw: string[] = Array.isArray(b.recipients)
    ? b.recipients.map((x: any) => String(x))
    : String(b.recipients || "").split(/[\s,;]+/);

  // Normalize, drop anything that isn't a valid Ghanaian number, and dedupe — a number
  // listed twice must be charged once, not twice.
  const seen = new Set<string>();
  let invalid = 0;
  for (const r of raw) {
    if (!String(r).trim()) continue;
    const p = normalizeGhPhone(String(r));
    if (!p) { invalid++; continue; }
    seen.add(p.intl);
  }
  const recipients = Array.from(seen);

  if (!recipients.length) {
    return NextResponse.json({ error: invalid ? "None of those numbers are valid Ghanaian numbers." : "Add at least one recipient." }, { status: 400 });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `That's ${recipients.length} recipients — send to at most ${MAX_RECIPIENTS} at a time.` }, { status: 400 });
  }

  // The sender ID must be one this account is actually allowed to use. A name the client
  // simply asserts would let anyone send as any business on the platform.
  const allowed = await allowedSendersFor(s.uid);
  const wanted = String(b.sender || "").trim();
  const sender = allowed.find((a) => a.toUpperCase() === wanted.toUpperCase()) || (wanted ? null : allowed[0]);
  if (!sender) {
    return NextResponse.json({ error: "That sender ID isn't approved for your account." }, { status: 400 });
  }

  const priced = await priceSmsCampaign(message, recipients.length);
  const ref = newSmsRef();

  // Debit the whole campaign up front (authoritative overdraft check). Whatever Arkesel
  // rejects is refunded inside runSmsCampaign.
  const debit = await spend(s.uid, {
    amount: priced.cost,
    ref,
    note: `Bulk SMS · ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} · ${priced.pages} page${priced.pages === 1 ? "" : "s"}`,
  });
  if (!debit.ok) return NextResponse.json({ error: debit.error || "Insufficient wallet balance." }, { status: 400 });

  const campaign = await runSmsCampaign({
    ref,
    userId: s.uid,
    role: s.role,
    sender,
    message,
    recipientsIntl: recipients,
    priced,
  });

  // A campaign where nothing was accepted is a failure the sender needs to see as one —
  // their money is already back, but a 200 would have the UI report it as sent.
  if (campaign.status === "failed") {
    return NextResponse.json(
      { error: campaign.error || "The SMS provider rejected the batch. You haven't been charged.", campaign: publicSmsCampaign(campaign) },
      { status: 502 }
    );
  }

  // `skipped` is how many pasted entries weren't usable numbers — the composer tells the
  // sender, so a bad paste isn't silently sent to half the list.
  return NextResponse.json({ campaign: publicSmsCampaign(campaign), skipped: invalid });
}
