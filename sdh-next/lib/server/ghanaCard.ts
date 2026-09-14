// Ghana Card (NIA) number validation. SERVER ONLY — the client may mirror this for instant
// feedback, but this is the copy that decides.
//
// Format: GHA-XXXXXXXXX-X — the literal prefix "GHA", nine digits, then a single check digit.
//
// SCOPE — READ THIS BEFORE TRUSTING IT:
// This proves a number is well-FORMED and screens out the fakes people actually type. It
// cannot prove the card EXISTS or belongs to the applicant. Only Ghana's NIA verification
// service can do that, and we hold no NIA credentials. The NIA does not publish a check-digit
// algorithm, so we deliberately do NOT invent one: a made-up checksum would reject real
// cards, which is far worse than accepting a well-formed fake that an admin then reviews.
// If NIA access is obtained later, add the lookup on top of this — nothing here needs to change.

const round = (s: string) => s.replace(/\s+/g, "").toUpperCase();

// Numbers that are structurally valid but obviously not real. Someone entering a placeholder
// or mashing the keypad hits one of these; a genuine applicant never does.
function isObviousFake(digits: string): boolean {
  if (/^(\d)\1{8}$/.test(digits)) return true;              // 000000000, 111111111, …
  if (digits === "123456789" || digits === "987654321") return true;
  // Any run of 9 strictly ascending or descending digits (234567890, 098765432, …).
  let asc = true, desc = true;
  for (let i = 1; i < digits.length; i++) {
    const prev = Number(digits[i - 1]), cur = Number(digits[i]);
    if (cur !== (prev + 1) % 10) asc = false;
    if (cur !== (prev + 9) % 10) desc = false;
  }
  return asc || desc;
}

// A flat result rather than a discriminated union: this project compiles with `strict: false`,
// where `ok: true | false` unions don't narrow, so a union here would make every caller's
// `.error` access a type error.
export interface GhanaCardResult {
  ok: boolean;
  /** Canonical form, always "GHA-XXXXXXXXX-X". Store and compare THIS, never raw input. */
  formatted?: string;
  digits?: string;      // the 9 significant digits
  checkDigit?: string;
  error?: string;
}

// Validate and normalise. Accepts what people really type — spaces, lowercase, missing
// hyphens, a missing "GHA" prefix — and returns one canonical string so the same card can't
// be registered twice under two spellings.
export function validateGhanaCard(raw: string): GhanaCardResult {
  const input = round(String(raw || ""));
  if (!input) return { ok: false, error: "Enter the Ghana Card number." };

  // Pull out the digits, tolerating GHA-123456789-0 / GHA1234567890 / 123456789 0 / etc.
  const body = input.startsWith("GHA") ? input.slice(3) : input;
  const digitsOnly = body.replace(/\D/g, "");

  if (/[^0-9\-]/.test(body))
    return { ok: false, error: "Ghana Card number should look like GHA-123456789-0." };
  if (digitsOnly.length !== 10)
    return {
      ok: false,
      error:
        digitsOnly.length < 10
          ? "That Ghana Card number is too short — it should be GHA followed by 10 digits."
          : "That Ghana Card number is too long — it should be GHA followed by 10 digits.",
    };

  const digits = digitsOnly.slice(0, 9);
  const checkDigit = digitsOnly.slice(9);

  if (isObviousFake(digits))
    return { ok: false, error: "That Ghana Card number isn't valid. Please enter the number exactly as printed on the card." };

  return { ok: true, formatted: `GHA-${digits}-${checkDigit}`, digits, checkDigit };
}

// Convenience for callers that only need the canonical string.
export function formatGhanaCard(raw: string): string | null {
  const res = validateGhanaCard(raw);
  return res.ok ? res.formatted! : null;
}
