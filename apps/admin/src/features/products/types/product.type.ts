/**
 * Feature-local entity types (product_requirements.md §6 — global entities go
 * in `src/types/models/`, feature-specific ones stay with their feature).
 * snake_case, matching `Category` and `IntegrationChannel`.
 *
 * **Provisional pending the API contract.** §6 briefs Product as
 * `id, game_id, name, cost_price, selling_price, provider_sku?, is_available`;
 * everything else here is read off the supplied reference and flagged in §4.6.
 */

export type ProductStatus = "active" | "inactive";

/**
 * Customer tiers a variant is priced for, in the reference card's order:
 * retail first, then the discounted trade tiers.
 */
export const PRICE_TIERS = ["public", "vip", "reseller", "agent"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

/** One purchasable nominal under a product, e.g. a diamond pack tier. */
export interface ProductVariant {
  id: string;
  name: string;
  /** §6's `cost_price` — upstream cost in IDR, the price card's `Cost` row. */
  cost_price: number;
  /** §6's `selling_price`, per tier. `public` is the retail price. */
  prices: Record<PriceTier, number>;
  status: ProductStatus;
}

export interface Product {
  id: string;
  name: string;
  /** Thumbnail. Absent on every fixture today — the cell falls back to an
   * initials tile, so real URLs drop in later with no code change. */
  image_url?: string;
  /** §6's FK. Kept for the API swap even though nothing resolves it yet. */
  game_id: string;
  /** Denormalized for display: no Game service exists, and the real API will
   * join. Searchable, but no longer a column of its own — the list shows the
   * price breakdown in that slot. */
  game_name: string;
  category_name: string;
  /** §6's `provider_sku`. */
  code: string;

  /* Captured by the Add form (§4.6). All optional — every fixture predates
     them, and the reference marks only name, code and category as required. */
  /** Secondary display name, the form's "Sub Name". */
  sub_name?: string;
  /** Parent `SubCategory`'s name, denormalized like `category_name`. */
  sub_category_name?: string;
  /** Which upstream API validates the buyer's account nickname. */
  nickname_validation?: string;
  /** A `PRODUCT_ACCESS_OPTIONS` value — which customer tier may buy this. */
  access?: string;
  /** A `PRODUCT_TAG_OPTIONS` value — storefront merchandising label. */
  tag?: string;
  /** Storefront copy shown on the product page. */
  description?: string;
  /** Lifecycle. First of the two stacked badges the reference shows. */
  status: ProductStatus;
  /** §6's `is_available` — storefront visibility. The second badge. */
  is_available: boolean;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductListParams {
  search?: string;
  /** Matches `category_name` — the toolbar's "Type to search category". */
  category?: string;
  /** A `PRICE_RANGE_OPTIONS` value — the toolbar's "All Price". */
  price?: string;
  page?: number;
  per_page?: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

/** A category the toolbar filters by and the Add form assigns. It carries the
 * game so a product created from the form still gets the denormalized
 * `game_id`/`game_name` the entity needs — the real API will join instead. */
export interface CategoryOption extends SelectOption {
  game_id: string;
  game_name: string;
}

/** A price bucket. `max` is exclusive; omitting it means "and above". */
export interface PriceRangeOption extends SelectOption {
  min: number;
  max?: number;
}
