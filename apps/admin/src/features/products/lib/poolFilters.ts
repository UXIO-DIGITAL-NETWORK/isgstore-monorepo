/**
 * The filter state for Add Product Provider, and what counts as "narrowed".
 *
 * Split out of the component so the bar stays a pure component — the page owns
 * this state, and the tests exercise `countActiveFilters` without rendering.
 */

/** `"all"` is the sentinel for "do not narrow on this". */
export const ALL = "all";

/** Every filter the bar owns, in one object so the page holds one state. */
export interface PoolFilterState {
  search: string;
  providerCategory: string;
  categoryId: string;
  poolState: string;
  availability: string;
  costMin: string;
  costMax: string;
  sort: string;
}

export const EMPTY_POOL_FILTERS: PoolFilterState = {
  search: "",
  providerCategory: ALL,
  categoryId: ALL,
  // "All", not "New only". `is_new` means the provider published it recently,
  // and the price checker backdates the whole catalogue on its first run — so on
  // an established install nothing is new, and a "New only" default opens this
  // page onto an empty table hiding the very catalogue it exists to offer.
  poolState: ALL,
  availability: "available",
  costMin: "",
  costMax: "",
  sort: ALL,
};

/**
 * Which filters are narrowing the list right now — drives the reset affordance.
 *
 * Measured against the defaults, not against "empty": "Available only" is the
 * default, so counting it would report "1 filter active" on an untouched page.
 */
export const countActiveFilters = (filters: PoolFilterState): number =>
  (Object.keys(filters) as (keyof PoolFilterState)[]).filter(
    (key) => filters[key] !== EMPTY_POOL_FILTERS[key],
  ).length;
