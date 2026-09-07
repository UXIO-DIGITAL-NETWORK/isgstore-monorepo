export const CHIP_KEYS = [
  "fastProcess",
  "cheapPrice",
  "friendlyService",
  "easyPayment",
  "recommended",
] as const;

export type ChipKey = (typeof CHIP_KEYS)[number];

/**
 * Pre-selected so a satisfied customer can review in one click instead of
 * treating the modal as a writing task. It is only ever a starting value: the
 * chip renders visibly selected, is one click to remove, and nothing is stored
 * unless the customer presses "Kirim Ulasan" — skipping submits nothing.
 */
export const PREFILLED_CHIPS: readonly ChipKey[] = ["fastProcess"];

/** At or below this score the pre-filled praise no longer matches what the
 *  customer is telling us. */
export const LOW_RATING_THRESHOLD = 3;

/**
 * Whether a rating change should drop the chips we pre-selected.
 *
 * Only ever true while the selection is still ours (`prefillIntact`). Once the
 * customer has touched the chips themselves the selection is theirs, and we
 * never clear it for them — even if they then lower the score.
 */
export const shouldClearPrefill = (rating: number, prefillIntact: boolean): boolean =>
  prefillIntact && rating <= LOW_RATING_THRESHOLD;

/**
 * Composes the single `comment` string the API stores from the selected quick
 * -review labels and the free text. The API has one comment column, so the
 * chips have to survive as text or not at all.
 *
 * Returns undefined when there is nothing to say, so a bare star rating is
 * sent without an empty comment attached.
 */
export const buildReviewComment = (chipLabels: string[], freeText: string): string | undefined => {
  const body = [chipLabels.join(", "), freeText.trim()].filter(Boolean).join(" — ");
  return body || undefined;
};
