/**
 * Bank options for the withdrawal (disbursement) form.
 *
 * `code` is sent to the API as `bank_code` and forwarded to Monetapay as
 * `account_bank_code`. The gateway spec only names test cards (BNI, BCA), so
 * this is the common Indonesian set — reconcile against Monetapay's official
 * `account_bank_code` catalog before go-live.
 */
export const BANK_OPTIONS = [
  { code: "BCA", label: "BCA — Bank Central Asia" },
  { code: "BNI", label: "BNI — Bank Negara Indonesia" },
  { code: "BRI", label: "BRI — Bank Rakyat Indonesia" },
  { code: "MANDIRI", label: "Mandiri" },
  { code: "BSI", label: "BSI — Bank Syariah Indonesia" },
  { code: "CIMB", label: "CIMB Niaga" },
  { code: "PERMATA", label: "Permata Bank" },
  { code: "DANAMON", label: "Danamon" },
  { code: "BTN", label: "BTN — Bank Tabungan Negara" },
  { code: "MAYBANK", label: "Maybank Indonesia" },
  { code: "PANIN", label: "Panin Bank" },
  { code: "OCBC", label: "OCBC NISP" },
  { code: "BJB", label: "Bank BJB" },
  { code: "MEGA", label: "Bank Mega" },
  { code: "SINARMAS", label: "Bank Sinarmas" },
] as const;

/** Bank codes as a tuple, for schema validation. */
export const BANK_CODES = BANK_OPTIONS.map((b) => b.code) as [string, ...string[]];
