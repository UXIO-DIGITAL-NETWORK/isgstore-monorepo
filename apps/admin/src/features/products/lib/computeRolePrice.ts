/**
 * Selling price from supplier cost and a role markup, matching the backend's
 * PricingService: `ceil(cost * (1 + percent/100)) + flat`.
 */
export function computeRolePrice(cost: number, percent: number, flat = 0): number {
  if (!Number.isFinite(cost) || cost <= 0) return flat;
  return Math.ceil(cost * (1 + percent / 100)) + flat;
}

/** The implied markup percentage for a price over cost — the inverse, for prefilling percent mode. */
export function impliedPercent(cost: number, price: number): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return Math.round((price / cost - 1) * 10000) / 100;
}
