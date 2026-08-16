/**
 * WhatsApp / phone number helpers.
 *
 * The UI shows a fixed "+62" prefix chip next to every phone input, so the input
 * itself holds only the national part (no leading 0, no country code). These two
 * functions keep that contract: `toNationalPhone` strips a typed/pasted 0 or 62
 * so the field never shows a doubled country code, and `normalizeWhatsappNumber`
 * produces the canonical `+62…` form that is actually sent to the backend and
 * used to message the customer on WhatsApp.
 *
 * Default country is Indonesia (+62). An explicitly typed `+<code>` is respected
 * so other country codes keep working once a country selector is added.
 */

/** National digits for display in a +62-chipped input (drops a leading 0 or 62). */
export function toNationalPhone(raw: string, dialCode = "62"): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return digits.replace(/^0+/, "");
  if (digits.startsWith(dialCode)) return digits.slice(dialCode.length);
  return digits;
}

/** Canonical E.164-style number (e.g. "+6281234567") for the backend / WA send. */
export function normalizeWhatsappNumber(raw: string, dialCode = "62"): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // An explicit "+<code>" means the user gave a country code — respect it.
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // "00<code>" → international
  if (digits.startsWith("0")) return `+${dialCode}${digits.replace(/^0+/, "")}`;
  if (digits.startsWith(dialCode)) return `+${digits}`;
  return `+${dialCode}${digits}`;
}
