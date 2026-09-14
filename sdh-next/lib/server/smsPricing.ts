// Authoritative bulk-SMS pricing. SERVER ONLY.
//
// Backend-persisted and admin-managed (Pricing → SMS), the same way data bundles and result
// checkers are — the send route must never trust a rate from the client, and an admin
// editing the rate has to actually change what gets charged.
//
// Priced as SUPPLIER COST + MARKUP, not as an absolute sell price:
//   supplier — what Arkesel charges US per message page
//   markup   — what we add on top per page. This IS the platform's profit.
//   rate charged = supplier + markup
//
// Modelled this way deliberately. Arkesel's rate moves with volume and with their price
// changes, and an absolute sell price silently turns into a different margin (or a loss)
// the moment it does. Editing `supplier` to match the new invoice keeps the profit per page
// exactly where the admin set it.
//
// SMS is billed per PAGE per RECIPIENT, which is how every SMS provider (Arkesel included)
// charges: a 200-character message to 50 people is 100 billable messages, not 50.
import { getConfig } from "./db";

const round4 = (n: number) => Math.round(n * 10000) / 10000;

export interface SmsPricing {
  supplier: number;  // Arkesel's price to us per page
  markup: number;    // added on top per page — the platform's profit
}

// Arkesel's published rate sits around GH₵0.025–0.03/page depending on volume. Only a
// default until an admin publishes: the supplier figure should be set from the real
// Arkesel invoice, or the margin shown on the Pricing page is fiction.
export function defaultSmsPricing(): SmsPricing {
  return { supplier: 0.025, markup: 0.03 };
}

function sanitize(input: any): SmsPricing {
  const d = defaultSmsPricing();
  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? round4(n) : fallback;
  };
  // Legacy shape: the first cut of this stored absolute agent/customer prices. Derive the
  // markup from what an agent was paying so an existing published config doesn't silently
  // reset to the default rate on upgrade.
  if (input && input.markup === undefined && input.cost !== undefined) {
    const supplier = num(input.supplier, d.supplier);
    return { supplier, markup: Math.max(0, round4(num(input.cost, d.supplier + d.markup) - supplier)) };
  }
  return {
    supplier: num(input?.supplier, d.supplier),
    markup: num(input?.markup, d.markup),
  };
}

let cache: { at: number; value: SmsPricing } | null = null;
const TTL = 30_000;

export async function getSmsPricing(): Promise<SmsPricing> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let value = defaultSmsPricing();
  try {
    const c = await getConfig();
    const doc = await c.findOne({ key: "smsPricing" });
    if (doc?.value) value = sanitize(doc.value);
  } catch {}
  cache = { at: Date.now(), value };
  return value;
}

export async function saveSmsPricing(input: any): Promise<SmsPricing> {
  const clean = sanitize(input);
  const c = await getConfig();
  await c.updateOne(
    { key: "smsPricing" },
    { $set: { key: "smsPricing", value: clean, updatedAt: Date.now() } },
    { upsert: true }
  );
  cache = { at: Date.now(), value: clean };
  return clean;
}

// ---------------- message segmentation ----------------

// The GSM 03.38 basic alphabet. A message using only these characters is packed 7 bits per
// character, so a single page holds 160 of them; anything outside it forces the whole
// message to UCS-2, where a page holds only 70. Getting this wrong is not cosmetic — it is
// the difference between charging for one page and charging for three.
const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
// These seven are GSM-encodable but take TWO septets each (escape + character).
const GSM7_EXTENDED = "^{}\\[~]|€";

function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7.includes(ch) && !GSM7_EXTENDED.includes(ch)) return false;
  }
  return true;
}

// Billable pages for a message body, exactly as a provider counts them. Note the
// multi-page limits (153 / 67): concatenated SMS spends part of each page on the header
// that reassembles them, so a 161-character message is two pages of 153, not 160 + 1.
export function smsPages(message: string): number {
  const text = String(message || "");
  if (!text.length) return 0;

  if (isGsm7(text)) {
    let septets = 0;
    for (const ch of text) septets += GSM7_EXTENDED.includes(ch) ? 2 : 1;
    if (septets <= 160) return 1;
    return Math.ceil(septets / 153);
  }
  // UCS-2. Count UTF-16 code units, not characters: an emoji outside the BMP is a surrogate
  // pair and occupies two units on the wire.
  const units = text.length;
  if (units <= 70) return 1;
  return Math.ceil(units / 67);
}

// What a page costs the sender: our supplier cost plus the markup. Same rate for agents and
// customers — bulk SMS is a service the sender consumes, not something they resell on, so
// there's no wholesale/retail split and no commission on it (see agent Pricing → SMS).
export function smsSellRate(pricing: SmsPricing): number {
  return round4(pricing.supplier + pricing.markup);
}

export interface PricedSms {
  pages: number;
  recipients: number;
  unitRate: number;      // per page per recipient, for this buyer
  supplierRate: number;  // per page per recipient, what Arkesel bills us
  cost: number;          // total charged to the buyer's wallet
  supplierCost: number;  // what Arkesel will bill us — the platform's own margin reference
}

// Money for a given number of billable units (pages × recipients) at a per-page rate.
// Rounds the TOTAL to the cent, never the rate — a rate of GH₵0.055 must not become
// GH₵0.06 the moment it's charged.
export function smsAmount(pages: number, recipients: number, rate: number): number {
  return Math.round(Math.max(0, pages) * Math.max(0, recipients) * rate * 100) / 100;
}

// Price a campaign server-side. `recipients` is the deduped, validated count.
export async function priceSmsCampaign(message: string, recipients: number): Promise<PricedSms> {
  const pricing = await getSmsPricing();
  const pages = smsPages(message);
  const unitRate = smsSellRate(pricing);
  return {
    pages,
    recipients,
    unitRate,
    supplierRate: pricing.supplier,
    cost: smsAmount(pages, recipients, unitRate),
    supplierCost: smsAmount(pages, recipients, pricing.supplier),
  };
}
