/**
 * Formats a number as Indonesian Rupiah, e.g. formatCurrency(15231.89) ->
 * "Rp 15.231,89". Intl.NumberFormat("id-ID") inserts a non-breaking space
 * (U+00A0) after "Rp" — normalized to a regular space for predictable
 * string equality in tests/snapshots.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00A0/g, " ");
}
