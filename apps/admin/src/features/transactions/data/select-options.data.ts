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
  { value: "partial_refund", label: "Partial Refund" },
  { value: "partial_success", label: "Partial Success" },
];

export const PAYMENT_STATUS_OPTIONS: SelectOption[] = INVOICE_STATUS_OPTIONS;

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
