/**
 * Redeeming loyalty points at checkout.
 *
 * The maths lives here rather than in the component because the storefront's
 * Vitest glob is `src/**\/*.test.ts` and excludes `.tsx` — logic outside a `lib`
 * file cannot be tested in this app at all. The server re-derives all of it;
 * this is so the customer sees the same number before they commit.
 */

export interface PointRedemption {
  /** Points actually applied, after every cap. */
  points: number;
  /** What those points are worth in rupiah. */
  discount: number;
  /** True when points cover the whole order and nothing is left to pay. */
  coversEverything: boolean;
}

/**
 * The most points this order can absorb: never more than the customer holds,
 * and never more than the order is worth. Rounded **down**, so redeeming can
 * never overshoot the price into a credit note.
 */
export function maxRedeemablePoints(price: number, balance: number, rate: number): number {
  if (price <= 0 || balance <= 0) return 0;

  const safeRate = rate > 0 ? rate : 1;

  return Math.max(0, Math.min(balance, Math.floor(price / safeRate)));
}

/** What redeeming `requested` points does to this order. */
export function applyPoints(price: number, balance: number, rate: number, requested: number): PointRedemption {
  const safeRate = rate > 0 ? rate : 1;
  const points = Math.max(0, Math.min(requested, maxRedeemablePoints(price, balance, safeRate)));
  const discount = points * safeRate;

  return { points, discount, coversEverything: discount >= price && price > 0 };
}

/**
 * The order total after points and the channel fee.
 *
 * Fees are charged on the reduced price — the customer pays the fee on what
 * they are actually charged — which is also why a fully covered order owes
 * exactly nothing.
 */
export function totalAfterPoints(price: number, adminFee: number, discount: number): number {
  return Math.max(0, price - discount) + (price - discount > 0 ? adminFee : 0);
}
