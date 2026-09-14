// Authoritative airtime pricing. SERVER ONLY.
//
// Airtime is sold at FACE VALUE to everyone — GH₵10 of credit costs GH₵10, whether the buyer
// is a customer or an agent. There is no platform margin to configure and no reseller
// discount: Muviin rewards us our commission on their side, out of band, so nothing here
// marks the price up or down.
//
// The buy routes must never trust an amount sent by the client, so the charge is recomputed
// here from the requested face value alone.

// Muviin enforces GH₵1–GH₵500 per top-up. We match it exactly so an out-of-range amount is
// refused before the wallet is ever debited, instead of charging and refunding on rejection.
export const MIN_AIRTIME = 1;
export const MAX_AIRTIME = 500;

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface PricedAirtime {
  faceValue: number;   // credit the recipient receives
  cost: number;        // charged to the buyer — always the face value
  commission: number;  // always 0: our commission comes from Muviin, not from the buyer
  pkg: string;         // display label, e.g. "GH₵10.00 airtime"
}

export function airtimePkg(face: number): string {
  return `GH₵${Number(face).toFixed(2)} airtime`;
}

// Price an airtime top-up, or null if the amount is out of range.
export function priceAirtime(amountGhs: number): PricedAirtime | null {
  const face = round2(Number(amountGhs));
  if (!Number.isFinite(face) || face < MIN_AIRTIME || face > MAX_AIRTIME) return null;
  return { faceValue: face, cost: face, commission: 0, pkg: airtimePkg(face) };
}
