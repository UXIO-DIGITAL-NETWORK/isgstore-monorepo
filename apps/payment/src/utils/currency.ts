/**
 * Formats a number as Indonesian Rupiah, e.g. formatCurrency(15231.89) ->
 * "Rp 15.231,89". Intl.NumberFormat("id-ID") inserts a non-breaking space
 * (U+00A0) after "Rp" — normalized to a regular space for predictable
 * string equality in tests/snapshots.
 *
 * `fractionDigits` defaults to 2 (unchanged for existing Dashboard/Financial
 * callers). Transactions renders whole rupiah per its reference (e.g.
 * "Rp 4.752"), so it passes `{ fractionDigits: 0 }`.
 *
 * A value that is not a finite number renders as "-" rather than "RpNaN".
 * `Intl.NumberFormat` happily formats `undefined`, so a field the API stopped
 * sending — a renamed column, say — would otherwise reach the screen as a
 * price. An em dash is a visible absence; "RpNaN" reads like a broken app.
 */
export function formatCurrency(value: number, options?: { fractionDigits?: number }): string {
  if (!Number.isFinite(value)) return "-";

  const fractionDigits = options?.fractionDigits ?? 2;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(value)
    .replace(/\u00A0/g, " ");
}
