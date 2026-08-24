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
  /** Price controls (bulk feature). `0/null = no limit`. */
  is_price_locked?: boolean;
  is_price_hidden?: boolean;
  price_min?: number | null;
  price_max?: number | null;
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

/* ── Product Provider tab — Uxiotopup price list ──────────────────────────── */

/**
 * One row of the Uxiotopup price list (`GET /v1/uxiotopup/price-list`).
 * Uxiotopup is prepaid-only, so there is no `type` dimension anymore. `id` is
 * the `buyer_sku_code` (the uxiotopup service id) — the SKU is the natural key,
 * and `DataTable<TData extends {id: string}>` needs a string id.
 */
export interface UxiotopupPriceListItem {
  id: string;
  buyer_sku_code: string;
  name: string;
  category: string;
  /** Supplier cost in IDR at the configured price tier. */
  cost: number;
  /** The four uxiotopup tier prices, as published. */
  harga: number;
  harga_gold: number;
  harga_silver: number;
  harga_pro: number;
  /** Uxiotopup `status === "aktif"`. */
  available: boolean;
  /** Already mapped to one of our products (SupplierProduct exists). */
  already_mapped: boolean;
}

export interface UxiotopupPriceListParams {
  search?: string;
  only_unmapped?: boolean;
  page?: number;
  per_page?: number;
}

/** Suggested selling prices from the backend's SKU preview (pricing rules). */
export interface UxiotopupSuggestedPrices {
  price_modal: number;
  price_member: number;
  price_vip: number;
  price_reseller: number;
  price_agent: number;
}

export interface UxiotopupSkuPreview {
  buyer_sku_code: string;
  name: string;
  cost: number;
  already_mapped: boolean;
  suggested_prices: UxiotopupSuggestedPrices;
}

/** Single add: the admin picks a category and confirms the four tier prices. */
export interface AddUxiotopupProductInput {
  buyer_sku_code: string;
  category_id: string;
  sub_category_id?: string | null;
  name?: string;
  price_member: number;
  price_vip: number;
  price_reseller: number;
  price_agent: number;
  status: boolean;
}

/** Bulk add: one shared category, prices derived server-side per SKU. */
export interface BulkAddUxiotopupInput {
  category_id: string;
  sub_category_id?: string | null;
  status: boolean;
  buyer_sku_codes: string[];
}

export interface BulkAddUxiotopupResult {
  created: number;
  skipped: { buyer_sku_code: string; reason: string }[];
}

/* ── Product Provider tab — managed provider products ──────────────────────── */

/**
 * A managed provider product: a `SupplierProduct` mapping joined to its Product
 * and Supplier (`GET /v1/supplier-products`). This is the row the redesigned
 * Product Provider table lists — with the product's price breakdown, its
 * supplier, and the flags bulk/row actions act on. `is_system` rows come from
 * the Internal System supplier and are protected (not selectable, no delete).
 */
/**
 * Where a mapping sits in the provider pipeline. Mirrors the API's own
 * `SupplierProduct::poolState()` — never re-derive it here, or a badge and the
 * promote guard will eventually disagree.
 *
 * - `needs_margin` pooled, no price decided yet
 * - `ready`        pooled and priced, promotable
 * - `draft`        promoted to a product that has never been published
 * - `published`    live on the storefront
 */
export const POOL_STATES = ["needs_margin", "ready", "draft", "published"] as const;
export type PoolState = (typeof POOL_STATES)[number];

export const POOL_STATE_LABELS: Record<PoolState, string> = {
  needs_margin: "Needs margin",
  ready: "Ready",
  draft: "Draft",
  published: "Published",
};

export interface ProviderProduct {
  id: string;
  buyer_sku_code: string;
  /** Supplier cost in IDR (the price card's Cost row). */
  cost: number;
  is_active: boolean;
  is_price_locked: boolean;
  is_system: boolean;
  supplier_name: string;
  category_name: string;
  product_name: string;
  product_code: string;
  /** Pipeline stage, and the promote gate as the server decides it. */
  pool_state: PoolState;
  can_promote: boolean;
  promote_blocked_reason: string | null;
  /** True while the row is still pooled — its prices are a projection, not stored. */
  is_price_preview: boolean;
  /** Whether the SKU is still active upstream. */
  is_available: boolean;
  /** Selling-price window carried onto the product at promote. 0/null = no limit. */
  price_min: number | null;
  price_max: number | null;
  /** Per-tier margin overrides in percent; null = derived from pricing rules. */
  margins: Record<PriceTier, number | null>;
  /** The product's price breakdown, ready for `ProductPriceCell`. */
  variant: ProductVariant;
  created_at: string;
}

export interface ProviderProductListParams {
  search?: string;
  supplier_id?: string;
  category_id?: string;
  /** "active" | "inactive" | undefined (all). */
  status?: string;
  /** "auto" | "manual" | undefined — locked mappings are "manual". */
  mode?: string;
  /** Comma-joined ids, so the margin page can address an exact selection. */
  ids?: string;
  /** One of PoolState, or undefined for all. */
  pool_state?: string;
  /** "available" | "unavailable" | undefined — upstream availability. */
  availability?: string;
  min_cost?: number;
  max_cost?: number;
  page?: number;
  per_page?: number;
}

/** Per-tier profit-margin percentages sent to `POST …/profit-margin`. */
export interface SetProviderMarginInput {
  margin_member?: number | null;
  margin_vip?: number | null;
  margin_reseller?: number | null;
  margin_agent?: number | null;
  /** Sent only when the form actually carries the limit fields — omitting them
   * leaves an existing window alone rather than clearing it. */
  price_min?: number | null;
  price_max?: number | null;
}

/* ── Provider pool ─────────────────────────────────────────────────────────── */

/** One provider SKU offered by the Add panel, already filtered to a configured
 * Category Provider. */
export interface PoolCandidate {
  id: string;
  buyer_sku_code: string;
  name: string;
  /** The provider's own category string. */
  provider_category: string;
  /** Our category, resolved through the Category Provider mapping. */
  mapped_category_name: string | null;
  cost: number;
  available: boolean;
  already_pooled: boolean;
  already_promoted: boolean;
  is_new: boolean;
}

export interface PoolCandidateListParams {
  search?: string;
  provider_category?: string;
  category_id?: string;
  /** "new" (default) | "not_pooled" | "all". */
  pool_state?: string;
  /** "available" (default) | "unavailable" | "all". */
  availability?: string;
  page?: number;
  per_page?: number;
}

export interface PoolSummary {
  configured_categories: number;
  total_candidates: number;
  pooled_count: number;
  new_count: number;
}

export interface PoolResult {
  pooled: number;
  skipped: { buyer_sku_code: string; reason: string }[];
}

export interface PromoteResult {
  promoted: number;
  skipped: { id: number; buyer_sku_code: string; reason: string }[];
}

export interface PublishResult {
  published: number;
  skipped: { id: number; buyer_sku_code: string; reason: string }[];
}

/* ── Add Product (Bulk) ─────────────────────────────────────────────────────── */

/** One row to create in the Add Product Bulk flow. */
export interface BulkCreateProductItem {
  code: string;
  name: string;
  cost: number;
  sub_category_id?: string | null;
}

export interface BulkCreateProductsInput {
  supplier_id: string;
  category_id: string;
  items: BulkCreateProductItem[];
}

export interface BulkCreateProductsResult {
  created: number;
  skipped: { code: string; reason: string }[];
}
