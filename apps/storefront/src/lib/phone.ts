/**
 * WhatsApp / phone number helpers.
 *
 * Any country is accepted. A number that carries its own `+<code>` is taken at
 * the customer's word; only a number with no country code at all falls back to
 * the default country, which is what keeps the ordinary Indonesian `0812…`
 * working without asking every buyer to pick a country from a list.
 *
 * `sanitizePhoneInput` is what the field holds while typing, and it deliberately
 * preserves a typed `+`. Its predecessor stripped both leading zeroes *and* a
 * leading country code, which quietly corrupted every foreign number: a stored
 * `+6591234567` came back as `6591234567`, and saving it again produced
 * `+626591234567` — a different, invalid number, every time the customer opened
 * their settings. On the register form it was worse: it ran on each keystroke
 * and ate the `+` the moment it was typed, so a foreign code could never be
 * entered at all.
 *
 * `normalizeWhatsappNumber` produces the canonical `+…` form that is sent to the
 * backend. The backend normalises again at its own request boundary — this is
 * for the customer's benefit (what they see is what is stored), not a substitute
 * for that.
 */

export const DEFAULT_DIAL_CODE = "62";

/** Matches the API's rule. A country code never starts with 0, so neither can this. */
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/**
 * What the input field shows while typing: digits, and a single leading `+` if
 * the customer typed one. Nothing is stripped — a country code the customer
 * entered is theirs to keep.
 */
export function sanitizePhoneInput(raw: string): string {
  const hasPlus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");

  return hasPlus ? `+${digits}` : digits;
}

/** Canonical E.164 (e.g. "+6281234567890") for the backend / WhatsApp send. */
export function normalizeWhatsappNumber(raw: string, dialCode = DEFAULT_DIAL_CODE): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // An explicit "+<code>" means the customer gave a country code — respect it.
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // Each branch is terminal on purpose. "00" is the international call prefix in
  // most of the world, so what follows is already a complete number — falling
  // through would prepend the default country code to a foreign one.
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+${dialCode}${digits.replace(/^0+/, "")}`;
  if (digits.startsWith(dialCode)) return `+${digits}`;

  // No country code at all: assumed local. This is the one assumption the
  // "type your own +code" approach makes, and typing the code overrides it.
  return `+${dialCode}${digits}`;
}
