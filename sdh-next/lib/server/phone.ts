// Normalize a Ghanaian phone number to a canonical form.
// Accepts "24 000 0000", "0240000000", "233240000000", "+233 24 000 0000", etc.
// Returns { intl: "233XXXXXXXXX", local: "0XXXXXXXXX" } or null if invalid.
export function normalizeGhPhone(raw: string): { intl: string; local: string } | null {
  const digits = (raw || "").replace(/\D/g, "");
  let core: string; // the 9-digit national significant number (without leading 0)
  if (digits.startsWith("233") && digits.length === 12) core = digits.slice(3);
  else if (digits.length === 10 && digits.startsWith("0")) core = digits.slice(1);
  else if (digits.length === 9) core = digits;
  else return null;
  if (!/^\d{9}$/.test(core)) return null;
  return { intl: "233" + core, local: "0" + core };
}

// STRICT local-only form: exactly a leading 0 followed by 9 digits — "0509379146".
//
// Unlike normalizeGhPhone above, this deliberately REJECTS +233…, 233… and bare 9-digit
// input rather than converting them. AFA registration is submitted to MTN in local form, so
// the number captured has to be exactly what will be sent — accepting three spellings and
// silently rewriting them is how a typo becomes a registration on the wrong line.
// Spaces and hyphens are still tolerated, since those are formatting, not a different format.
export function strictLocalGhPhone(raw: string): string | null {
  const compact = String(raw || "").replace(/[\s-]/g, "");
  if (!/^0\d{9}$/.test(compact)) return null;
  return compact;
}
