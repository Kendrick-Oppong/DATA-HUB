// Product LINES — the sub-product a network sells data under. SERVER + CLIENT safe (types only).
//
// Two of our three networks sell data as more than one line, and each line prices and
// fulfils independently:
//
//   MTN   standard  → the ordinary MTN bundle
//         xpress    → MTN Xpress, express delivery (costs more upstream)
//   AT    ishare    → instant delivery, standard validity
//         bigtime   → bulk data that never expires
//   Telecel has a single line, so its product line is null.
//
// The wire/DB field that carries this is historically called `atProduct` (it started life
// as the AT-only iShare/BigTime switch). It now carries the line for ANY network, so the
// name is kept — renaming it would orphan every order already written — but the TYPE is
// `ProductLine`. Read `atProduct` as "product line", not "AT product".
export type MtnProduct = "standard" | "xpress";
export type AtProduct = "ishare" | "bigtime";
export type ProductLine = MtnProduct | AtProduct;

// Human names, for labels and pickers.
export const LINE_NAME: Record<ProductLine, string> = {
  standard: "MTN",
  xpress: "Xpress",
  ishare: "iShare",
  bigtime: "BigTime",
};

// The line a network defaults to when the caller didn't pick one. Telecel has none.
export function defaultLine(net: string): ProductLine | null {
  if (net === "mtn") return "standard";
  if (net === "atigo") return "ishare";
  return null;
}

// Coerce whatever arrived on the wire into a line this network actually sells.
// Anything unrecognized falls back to the network's default line rather than erroring —
// an old client that sends nothing (or sends "ishare" for MTN) still buys the standard
// bundle it was showing, never a pricier one.
export function normalizeLine(net: string, raw?: string | null): ProductLine | null {
  const v = String(raw || "").toLowerCase();
  if (net === "mtn") return v === "xpress" ? "xpress" : "standard";
  if (net === "atigo") return v === "bigtime" ? "bigtime" : "ishare";
  return null;
}
