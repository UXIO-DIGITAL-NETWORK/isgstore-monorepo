/**
 * The withdrawal (payout) fee, charged on every request.
 *
 * Mirrors the server's `CreateWithdrawalRequestAction::resolveFee()` —
 * `flat + round(amount * percent / 100)`, integer rupiah — so the client can
 * show the fee and what will land in the bank before submitting. The server
 * recomputes on submit and *its* figure is the one charged; this only previews.
 *
 * Keep the constants in sync with the backend config
 * (`services.withdrawal.{fee_flat,fee_percent,min_amount}`).
 */
export const WITHDRAWAL_FEE_FLAT = 1500;
export const WITHDRAWAL_FEE_PERCENT = 11;
export const WITHDRAWAL_MIN_AMOUNT = 10000;

/** Fee for a given gross amount. Non-positive/!finite amounts yield 0. */
export function withdrawalFeeFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return WITHDRAWAL_FEE_FLAT + Math.round(amount * (WITHDRAWAL_FEE_PERCENT / 100));
}

/** What reaches the merchant's bank: amount − fee. */
export function withdrawalNettFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return amount - withdrawalFeeFor(amount);
}
