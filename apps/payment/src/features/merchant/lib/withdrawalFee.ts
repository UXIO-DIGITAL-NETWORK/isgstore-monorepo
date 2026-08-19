/**
 * The withdrawal (payout) fee, charged on every request.
 *
 * Mirrors the server's `CreateWithdrawalRequestAction::resolveFee()` —
 * `fee_flat + round(fee_flat * fee_percent / 100)`, integer rupiah — a FLAT
 * charge that is the same for every amount (1500 + 11% of 1500 = 1665). The
 * client shows the fee and what will land in the bank before submitting; the
 * server recomputes on submit and *its* figure is the one charged.
 *
 * Keep the constants in sync with the backend config
 * (`services.withdrawal.{fee_flat,fee_percent,min_amount}`).
 */
export const WITHDRAWAL_FEE_FLAT = 1500;
export const WITHDRAWAL_FEE_PERCENT = 11;
export const WITHDRAWAL_MIN_AMOUNT = 10000;

/** The flat fee (amount-independent). Non-positive/!finite amounts yield 0 so no preview shows. */
export function withdrawalFeeFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return WITHDRAWAL_FEE_FLAT + Math.round(WITHDRAWAL_FEE_FLAT * (WITHDRAWAL_FEE_PERCENT / 100));
}

/** What reaches the merchant's bank: amount − fee. */
export function withdrawalNettFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return amount - withdrawalFeeFor(amount);
}
