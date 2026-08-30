import type { SelectOption } from "../types/transaction.type";

/** Small typed fixed lists for the filter-bar selects (product_requirements.md §4.3). */
export const USER_OPTIONS: SelectOption[] = [
  { value: "1001", label: "Randy Galang" },
  { value: "1002", label: "Sinta Dewi" },
  { value: "1003", label: "Budi Santoso" },
  { value: "1004", label: "Wulan Ayu" },
];

export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "cat-mobile", label: "Mobile Games" },
  { value: "cat-battle-royale", label: "Battle Royale" },
  { value: "cat-open-world", label: "Open World" },
];

export const PRODUCT_OPTIONS: SelectOption[] = [
  { value: "prod-19-diamond", label: "19 Diamond (17 + 2 Bonus)" },
  { value: "prod-100-diamond", label: "100 Diamond" },
  { value: "prod-660-uc", label: "660 UC" },
  { value: "prod-genesis-crystal", label: "980 Genesis Crystal" },
];

export const INVOICE_STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "partial_success", label: "Partial Success" },
];

/**
 * The gateway's own vocabulary, and deliberately NOT an alias of the invoice
 * options it used to be. A payment is never "processing" and never "partial" —
 * offering those could only ever produce an empty result.
 *
 * `none` is not a gateway state: it selects orders that never went through a
 * gateway at all, which is the whole population of the Manual tab and is
 * otherwise unreachable.
 */
export const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Unpaid" },
  { value: "success", label: "Paid" },
  { value: "expired", label: "Expired" },
  { value: "refunded", label: "Refunded" },
  { value: "none", label: "No Gateway" },
];

/** The supplier's own vocabulary. Mirrors the Provider column exactly. */
export const PROVIDER_STATUS_OPTIONS: SelectOption[] = [
  { value: "not_ordered", label: "Not Ordered" },
  { value: "queued", label: "Queued" },
  { value: "sending", label: "Sending" },
  { value: "ordered", label: "In Progress" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
  { value: "undelivered", label: "No Response" },
];

/**
 * What an admin may set by hand, as opposed to what they may filter by.
 *
 * `refunded` is filterable but not settable: the API rejects it on
 * `manual-review` because the status now asserts that money went back to the
 * customer. Refunds are created by the refund flow and completed on the Refunds
 * page — a dropdown must not be able to claim one that never happened.
 */
export const EDITABLE_INVOICE_STATUS_OPTIONS: SelectOption[] = INVOICE_STATUS_OPTIONS.filter(
  (option) => option.value !== "refunded",
);

export const INVOICE_FROM_OPTIONS: SelectOption[] = [
  { value: "website", label: "Website" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "admin", label: "Admin (Manual)" },
];

export const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: "Credits", label: "Credits" },
  { value: "QRIS", label: "QRIS" },
  { value: "Virtual Account", label: "Virtual Account" },
  { value: "E-Wallet", label: "E-Wallet" },
];
