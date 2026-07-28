import type { PriceRangeOption, SelectOption } from "../types/product.type";

/** Sources the toolbar's "Type to search category" select. Values are the
 * `category_name` stored on each product — a contract test pins that every
 * fixture's category is reachable here, so a typo can't produce a filter that
 * silently matches nothing. */
export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "Mobile Legends: Indonesia", label: "Mobile Legends: Indonesia" },
  { value: "Free Fire Indonesia", label: "Free Fire Indonesia" },
  { value: "Genshin Impact", label: "Genshin Impact" },
  { value: "PUBG Mobile", label: "PUBG Mobile" },
  { value: "Valorant", label: "Valorant" },
  { value: "Honkai: Star Rail", label: "Honkai: Star Rail" },
];

/**
 * Sources the toolbar's "All Price" select.
 *
 * **Inferred, not confirmed** (§4.6): the reference shows only the trigger's
 * "All Price" label and never opens the list, so the options are not visible.
 * "All Price" reads as the clear-all value of a price filter, so this is
 * modelled as ranges. `max` is exclusive; the last bucket is open-ended.
 * Revise when a reference or the API shows what this actually filters.
 */
export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { value: "under-10k", label: "Under Rp 10.000", min: 0, max: 10_000 },
  { value: "10k-50k", label: "Rp 10.000 - Rp 50.000", min: 10_000, max: 50_000 },
  { value: "50k-100k", label: "Rp 50.000 - Rp 100.000", min: 50_000, max: 100_000 },
  { value: "over-100k", label: "Over Rp 100.000", min: 100_000 },
];
