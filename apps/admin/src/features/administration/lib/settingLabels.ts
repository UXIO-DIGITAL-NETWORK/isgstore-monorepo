/**
 * A readable label for a name the API gives us and no locale file covers:
 * `payment_link` → "Payment link", `operational` → "Operational".
 *
 * Both the setting groups and the payment methods inside a JSON value come from
 * the API, so a name this panel has never heard of must still read like a word
 * rather than like a database column.
 */
export function humanize(value: string): string {
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
