import type { TransactionStatus } from "@/types/models/transaction.model";

/**
 * How each API status is presented on the invoice.
 *
 * The API's status machine has seven states; the customer-facing card only ever
 * showed the hardcoded "PENDING" amber badge. These maps translate the full set
 * into the badge styles the card already uses, so no new visual language is
 * introduced — an amber pending, a green success, a red failure.
 */
export const PAYMENT_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "paymentMethod.pending",
  PAID: "success.paid",
  PROCESSING: "paymentMethod.pending",
  COMPLETED: "success.success",
  FAILED_PROVIDER: "failed.failed",
  EXPIRED: "failed.failed",
  REFUNDED: "failed.failed",
};

type BadgeStyle = { wrapper: string; text: string };

const AMBER: BadgeStyle = {
  wrapper: "rounded-md bg-amber-500/20 border border-amber-500/40 px-3 py-0.5",
  text: "font-plex font-bold text-[11px] text-amber-400 leading-none",
};

const GREEN: BadgeStyle = {
  wrapper: "rounded-md bg-green-500/20 border border-green-500/40 px-3 py-0.5",
  text: "font-plex font-bold text-[11px] text-green-400 leading-none",
};

const RED: BadgeStyle = {
  wrapper: "rounded-md bg-red-500/20 border border-red-500/40 px-3 py-0.5",
  text: "font-plex font-bold text-[11px] text-red-400 leading-none",
};

export const TRANSACTION_STATUS_STYLES: Record<TransactionStatus, BadgeStyle> = {
  PENDING: AMBER,
  PAID: AMBER,
  PROCESSING: AMBER,
  COMPLETED: GREEN,
  FAILED_PROVIDER: RED,
  EXPIRED: RED,
  REFUNDED: RED,
};
