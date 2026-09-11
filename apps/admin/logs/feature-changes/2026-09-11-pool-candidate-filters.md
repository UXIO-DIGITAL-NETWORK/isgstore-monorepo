# 2026-09-11 — Full filter bar on Add Product Provider

**Scope:** products (Add Product Provider / pool candidates)
**Type:** feat
**Author/agent:** you

## What changed

- **Filter bar rebuilt** on `/admin/products/provider/add`. Was: search, pool
  state, availability. Now also **provider category**, **our mapped category**,
  a **cost range** (min/max, both inclusive), and a **sort**. Extracted into
  `PoolCandidateFilters`; the page keeps one `PoolFilterState` object.
- **New `GET /v1/uxiolabs/pool-facets`** feeding the dropdowns: provider
  categories with counts, our categories behind them, and the real cost bounds
  (rendered as a "Costs run Rp X – Rp Y" hint under the inputs).
- **API filters:** `cost_min`, `cost_max`, `sort`
  (`name_asc|name_desc|cost_asc|cost_desc`) on `pool-candidates`.
- **Reset affordance:** an "N filters active" badge plus "Reset filters",
  shown only once something differs from the defaults.
- Typed inputs (search, both cost fields) are debounced via a new shared
  `useDebouncedValue`; selects are not.

## Why

- The page lists a provider's whole catalogue for every configured game —
  thousands of rows spanning three orders of magnitude in cost (Rp 1.500 to
  Rp 1,3 juta in the Mobile Legends feed alone). Search alone cannot express
  "the Free Fire denominations under twenty thousand", which is the shape of
  question someone building a catalogue actually asks.
- **Two category filters, not one.** The provider's `kategori` is what the
  upstream feed is organised by; our category is what an admin thinks in, and
  several provider categories can map onto one of ours. `provider_category` and
  `category_id` were already supported server-side — only the UI was missing.
- **Free cost inputs, not the `PRICE_RANGE_OPTIONS` bands** used on Main
  Products. Those bands top out at "over Rp 100.000", which is one bucket for
  more than half of this feed.
- **Facets describe the whole universe, never the active filters.** Recomputing
  them against what is selected makes options disappear as they are used — a
  filter bar that narrows itself into a dead end.
- **Sorting is opt-in.** The default stays the provider's own feed order, which
  groups a game's denominations together.

## Files touched

- `src/features/products/components/PoolCandidateFilters.tsx` (new)
- `src/features/products/lib/poolFilters.ts` (new — state shape, defaults,
  `countActiveFilters`; split out so the bar stays a pure component and
  react-refresh stays happy)
- `src/features/products/pages/PoolCandidatesPage.tsx`
- `src/features/products/{types/product.type.ts,services/providerPool.service.ts,hooks/useProviderPool.ts}`
- `src/hooks/useDebouncedValue.ts` (new, shared)
- `src/test/fakeApi.ts` (candidate fixture honours the new params; facets endpoint)
- API: `ListUxiolabsPoolCandidatesAction` (`facets()`, `sort()`, cost bounds),
  `PoolCandidateQueryRequest`, `UxiolabsPoolController::facets`, `routes/api.php`

## Verification

- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] `npm run test` — 619 tests, 98 files. New:
      `src/features/products/tests/PoolCandidateFilters.test.tsx`
- [x] `tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 11 pre-existing warnings)
- [x] API: `composer run test` — 1060 passed; `pint` clean. New:
      `tests/Feature/Uxiolabs/PoolCandidateFiltersTest.php` (13 cases), including
      that no filter becomes a way around the Category Provider mapping
- [ ] Renders in both light and dark — not yet checked in a browser
- [ ] Reconciled against Figma — no frame exists for this bar

## Notes / follow-ups

- **An inverted range is dropped, not sent.** Mid-edit a ceiling is briefly
  below the floor; the API 422s on that, so the page omits `cost_max` rather
  than turning a keystroke into an error toast. The API still validates it, for
  anyone calling the endpoint directly.
- Filtering and sorting happen **in PHP over the cached price list**, not in
  SQL — this feed is an upstream HTTP payload, not a table. It is a few
  thousand rows behind a 5-minute cache, so this is fine; if the catalogue grows
  by an order of magnitude the whole `rows()` pipeline needs rethinking, not
  just the sort.
- The bar wraps rather than collapsing into a "Filters" popover. Seven controls
  fit on a desktop panel, which is where this page is used; if an eighth is
  added, revisit.
