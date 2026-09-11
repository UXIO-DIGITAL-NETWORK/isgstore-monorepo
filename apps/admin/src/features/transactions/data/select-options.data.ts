import type { KeyedSelectOption, SelectOption } from "../types/transaction.type";

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

export const INVOICE_STATUS_OPTIONS: KeyedSelectOption[] = [
  { value: "pending", labelKey: "pillPending" },
  { value: "processing", labelKey: "pillProcessing" },
  { value: "success", labelKey: "optSuccess" },
  { value: "failed", labelKey: "pillFailed" },
  { value: "refunded", labelKey: "optRefunded" },
  { value: "partial_success", labelKey: "optPartialSuccess" },
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
export const PAYMENT_STATUS_OPTIONS: KeyedSelectOption[] = [
  { value: "pending", labelKey: "optUnpaid" },
  { value: "success", labelKey: "optPaid" },
  { value: "expired", labelKey: "badgeExpired" },
  { value: "refunded", labelKey: "optRefunded" },
  { value: "none", labelKey: "optNoGateway" },
];

/** The supplier's own vocabulary. Mirrors the Provider column exactly. */
export const PROVIDER_STATUS_OPTIONS: KeyedSelectOption[] = [
  { value: "not_ordered", labelKey: "optNotOrdered" },
  { value: "queued", labelKey: "optQueued" },
  { value: "sending", labelKey: "optSending" },
  { value: "ordered", labelKey: "optInProgress" },
  { value: "unconfirmed", labelKey: "optUnconfirmed" },
  { value: "delivered", labelKey: "badgeDelivered" },
  { value: "rejected", labelKey: "optRejected" },
  { value: "undelivered", labelKey: "optNoResponse" },
];

/**
 * What an admin may set by hand, as opposed to what they may filter by.
 *
 * `refunded` is filterable but not settable: the API rejects it on
 * `manual-review` because the status now asserts that money went back to the
 * customer. Refunds are created by the refund flow and completed on the Refunds
 * page — a dropdown must not be able to claim one that never happened.
 */
export const EDITABLE_INVOICE_STATUS_OPTIONS: KeyedSelectOption[] = INVOICE_STATUS_OPTIONS.filter(
  (option) => option.value !== "refunded",
);

export const INVOICE_FROM_OPTIONS: KeyedSelectOption[] = [
  { value: "website", labelKey: "optWebsite" },
  { value: "mobile-app", labelKey: "optMobileApp" },
  { value: "admin", labelKey: "optAdminManual" },
];

export const PAYMENT_METHOD_OPTIONS: KeyedSelectOption[] = [
  { value: "Credits", labelKey: "optCredits" },
  { value: "QRIS", labelKey: "optQris" },
  { value: "Virtual Account", labelKey: "optVirtualAccount" },
  { value: "E-Wallet", labelKey: "optEwallet" },
];
