/**
 * The client-facing wording for a service invoice's status.
 *
 * One dictionary, because the same ENUM reached the screen from three places —
 * the invoice detail header, the purchase-history table, and a batch's covered
 * bills — and "WAITING_CONFIRMATION" tells the person being billed nothing.
 *
 * Only the key mapping lives here: the words belong to the locales, so both
 * languages stay in step. A status we have no wording for returns undefined and
 * the badge falls back to the raw enum, exactly as before, rather than showing
 * an empty chip.
 */
const LABEL_KEY: Record<string, string> = {
  UNPAID: "invoiceStatus.unpaid",
  WAITING_CONFIRMATION: "invoiceStatus.waitingConfirmation",
  PAID: "invoiceStatus.paid",
  REJECTED: "invoiceStatus.rejected",
  CANCELLED: "invoiceStatus.cancelled",
  EXPIRED: "invoiceStatus.expired",
};

export function invoiceStatusLabelKey(status: string | null | undefined): string | undefined {
  return status ? LABEL_KEY[status] : undefined;
}
