import type { PriceListTier } from "@/features/price-list/types/priceList.type";

/**
 * The price table used to be six fixed columns — Game, Layanan, Harga Normal,
 * Member, Gold, Status — where "Gold" was really `price_vip`, a different
 * plan's price. Tiers are data now, so the grid has to be built rather than
 * written down.
 *
 * This lives in a plain module because the storefront's Vitest glob is
 * `src/**\/*.test.ts` and deliberately excludes `.tsx`: logic that is not in a
 * `lib` file cannot be tested here at all.
 */

/** Fixed columns either side of the tier block: game, service … status. */
const LEADING_COLS = "minmax(0,1.4fr) minmax(0,2.2fr) minmax(0,1.3fr)";
const TRAILING_COLS = "minmax(0,0.9fr)";

/** The CSS grid template for a table showing `tierCount` membership tiers. */
export function tierGridTemplate(tierCount: number): string {
  const tiers = Array.from({ length: Math.max(tierCount, 0) }, () => "minmax(0,1.3fr)").join(" ");

  return [LEADING_COLS, tiers, TRAILING_COLS].filter(Boolean).join(" ");
}

/**
 * Colour per tier, walking the brand palette from the member army green up to
 * the light gold. Derived from position rather than plan code, because a plan
 * "hokage" has no colour of its own and must still read as a rung on a ladder.
 */
const TIER_PALETTE = ["rgb(67,86,32)", "rgb(208,201,129)", "rgb(247,246,198)"] as const;

export function tierColor(index: number, total: number): string {
  if (total <= 1) return TIER_PALETTE[TIER_PALETTE.length - 1];

  // Always end on the top-tier light gold, spreading the rest across the palette.
  const position = Math.round((index / (total - 1)) * (TIER_PALETTE.length - 1));

  return TIER_PALETTE[Math.min(position, TIER_PALETTE.length - 1)];
}

/**
 * What a tier cell shows. A hidden tier is the highest one: its price is the
 * reason to subscribe, so the row still appears but the number does not.
 */
export function tierPriceLabel(
  tier: PriceListTier,
  format: (value: number) => string,
  hiddenLabel: string,
): string {
  if (tier.isHidden || tier.price === null) return hiddenLabel;

  return format(tier.price);
}

/**
 * The tiers to render as columns, excluding the default plan — its price is
 * already the "Harga Normal" column, and showing it twice reads as a bug.
 */
export function displayTiers(tiers: PriceListTier[]): PriceListTier[] {
  return tiers.filter((tier) => !tier.isDefault);
}
