/**
 * Normalise whatever the nickname provider returned into the player's name.
 *
 * Providers disagree wildly on shape. A free URL lookup answers with a bare
 * name ("EkaNata"), while the Digiflazz cek-username SKU hands back its whole
 * receipt line verbatim:
 *
 *   "User ID 63193868 Zone 2027 / Username EkaNata / Region = ID"
 *
 * The API stores that string as-is (`ValidateGameIdAction::extractDigiflazzNickname`
 * only trims it), so the trimming happens here — the confirmation modal must
 * show a name, not a receipt.
 */

/** Segment separators used by the receipt-style providers. */
const SEGMENT_SEPARATOR = /[/|\n]/;

/** `Username EkaNata`, `Nickname: Budi`, `Nama = Siti` — label, then the name. */
const LABELLED_NAME = /^(?:username|nickname|nama|name)(?:\s*[:=]\s*|\s+)(.+)$/i;

export function parseNickname(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  for (const segment of trimmed.split(SEGMENT_SEPARATOR)) {
    const match = segment.trim().match(LABELLED_NAME);
    const name = match?.[1]?.trim();

    if (name) return name;
  }

  // Unrecognised shape — a provider that already answers with a plain name, or
  // a format nobody has seen yet. Return it untouched: turning "found" into
  // "not found" here would block a checkout that the provider approved.
  return trimmed;
}
