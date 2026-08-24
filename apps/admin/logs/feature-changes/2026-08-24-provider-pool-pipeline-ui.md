# 2026-08-24 — Provider pool UI: Category Provider → pool → margin → draft → publish

**Scope:** `src/features/categories/*`, `src/features/products/*`, `src/test/*`
**Type:** feat
**Author/agent:** you

## What changed

The admin half of the provider pipeline the API shipped earlier. Previously a
provider SKU could only enter the system by becoming a sellable Main Product
immediately; there is now a pool between the two, and pricing is a gate rather
than an afterthought.

### Category Provider
- **Provider Category replaces Provider Template.** The old select offered a
  hardcoded list whose own comment admitted it was "invented — not confirmed
  anywhere"; nothing read the value, so a typo was invisible. It now reads the
  provider's live catalogue (`GET /v1/uxiotopup/categories`), which the API
  groups by `kategori` — each value appears once however many SKUs share it.
- **Already-mapped categories are marked and unpickable**, listed under a
  separate "Already added" heading with the category they belong to, so the same
  catalogue cannot be mapped twice.
- The select is disabled for a provider with no catalogue integration (only
  Uxiotopup has one) instead of silently offering another supplier's categories.
- The list column reconciles each row against the live catalogue and badges a
  mapping that matches nothing as `Unmatched`.
- Removed `PROVIDER_TEMPLATE_OPTIONS`.

### Product Provider (the pool)
- **"Add Product Provider" no longer navigates.** It opens an in-page panel
  (`PoolCandidatesPanel`) listing only SKUs whose provider category has a
  Category Provider mapping — configuring a game is what makes its catalogue
  appear. Already-pooled SKUs stay visible but are not selectable.
- Full filters: search, stage, category, provider availability, plus the
  existing status/price-mode. A `New` count badge sits on the Add button.
- Row and bulk actions gain **Promote to Main Product** and **Publish**. Promote
  renders disabled with the server's own reason inside the item — a disabled
  `DropdownMenuItem` swallows pointer events, so a tooltip there would never fire.
- The Status column became the pipeline stage (`Needs margin` / `Ready` /
  `Draft` / `Published`). "Inactive" was equally true of a pooled row, a draft
  and a retired product, which told an operator nothing.
- A pooled row has no product, so its prices are projected from cost + margin and
  labelled as a projection instead of rendering as zeroes.

### Set Profit Margin
- Serves single and bulk through the same `?ids=`; the row action opens it
  instead of the old dialog (deleted).
- **Stops filtering the selection in the browser.** It pulled one page of 100 and
  narrowed client-side, silently dropping any row outside it; it now asks the API
  for exactly the selection via the new `ids` filter.
- Gains Lower/Upper Price Limit alongside the margins.

### Removed
`ProductProviderPage` (whole-price-list browse), `ProviderToolbar`,
`providerColumns`, `AddProviderProductDialog`, `BulkAddProviderDialog`,
`providerAdd.schema`, `ProviderMarginDialog`. `/provider/add` is a redirect for
one release. The `_preview` twin now renders the same page as the protected
route — the two had drifted.

## Why

Category Provider previously wrote a record nothing read. Making it decide which
SKUs are on offer is what turns it into the first step of a pipeline, and the
pool is what lets an operator check price and data before anything is sellable.

## Bugs found and fixed on the way

- `provider.service.ts`'s `list()` accepted the new filter params in its type but
  never forwarded them — the pool filters and the margin page's `ids` would have
  been silently ignored. Caught by a test, not by the compiler.
- `ProductPriceCell` computed `margin / price` with no guard; preview rows made a
  zero price reachable, which would have rendered `NaN%`.
- `toProviderProduct` built `variant.id` from a product id or a supplier-product
  id interchangeably — two different counters that can collide on one React key.

## Verification

- [x] `npm run test` — 82 files, 469 tests, green (also under `CI=1 TZ=UTC`)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (10 pre-existing react-compiler warnings)
- [ ] Not exercised against the live API; fakeApi serves the new endpoints.
