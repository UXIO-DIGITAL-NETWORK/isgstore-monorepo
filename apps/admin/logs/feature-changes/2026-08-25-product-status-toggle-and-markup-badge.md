# 2026-08-25 — Main Products: reversible row actions + markup badge

**Scope:** products — Main Products list (row menu, price cell)
**Type:** fix
**Author/agent:** you

## What changed
- The row menu's lifecycle item now reads the row's own status: an inactive row
  is offered **Activate** (with its own confirm copy and `PowerOff`/`Power`
  icon), an active row keeps **Deactive**. Previously every row said "Deactive",
  including rows whose Status column already read Inactive.
- API: `POST /v1/products/bulk/deactivate` → `POST /v1/products/bulk/status`,
  now taking an `active` boolean, mirroring `bulk/lock-price` and
  `bulk/show-price`. `BulkProductAction::deactivate()` → `setStatus($ids, $active)`.
- Client: `bulkDeactivate(ids)` → `bulkSetStatus(ids, active)`;
  `useDeactivateProducts` → `useSetProductStatus({ ids, active })`, whose toast
  names the direction that actually ran.
- The toolbar's bulk action stays deactivate-only (posts `active: false`) — a
  selection can hold both active and inactive rows, so there is no single status
  to invert.
- The row menu's **Lock Price** and **Show Price** are toggles too, for the same
  reason: a locked row now reads "Unlock Price", a hidden one "Show Price", a
  visible one "Hide Price". Before this there was no way to unlock or hide a
  price from the list at all — only the Provider list's menu toggled.
- Deleted `productsService.deactivate(id)`, dead since the row menu moved to the
  bulk endpoint; `bulkSetStatus` is now the single lifecycle path. Its "leaves
  `is_available` alone" guarantee moved into the API test, where it now lives.
- Test fixtures: `prod-2` ships `is_price_locked`/`is_price_hidden`, and the fake
  API stopped dropping both flags on the way out — every row used to read
  unlocked and visible regardless of its fixture.
- Price cell: the percentage badge is now markup over cost (`margin / cost`)
  instead of gross margin (`margin / price`), so it reads back the number typed
  into the margin field — a 20% markup shows 20.0%, not 16.7%.

## Why
- The menu and the Status badge sat one column apart and contradicted each
  other; "Deactive" on an inactive row is a no-op an admin cannot distinguish
  from a failed request. Making it a toggle also removed the dead end — there
  was previously no way to reactivate a product from the list at all.
- `PricingService` prices a tier as `cost * (1 + markup/100)`, so markup is the
  only percentage an admin ever enters. Showing gross margin next to it made the
  two disagree on screen with no explanation.

## Files touched
- `src/features/products/components/ProductRowActions.tsx`
- `src/features/products/components/ProductPriceCell.tsx`
- `src/features/products/hooks/useProducts.ts`
- `src/features/products/services/products.service.ts`
- `src/features/products/pages/MainProductsPage.tsx`
- `src/features/products/tests/MainProductRowActions.test.tsx`
- `src/features/products/tests/MainProductBulkActions.test.tsx`
- `src/features/products/tests/MainProductsPage.test.tsx`
- `../uxiotopup-api/routes/api.php`
- `../uxiotopup-api/app/Http/Controllers/Api/Product/ProductController.php`
- `../uxiotopup-api/app/Http/Requests/Product/BulkProductActionRequest.php`
- `../uxiotopup-api/app/Actions/Product/BulkProductAction.php`
- `../uxiotopup-api/tests/Feature/Product/ProductBulkActionsTest.php`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] `npm run test` passes (477 tests, 82 files — full suite)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; the 10 pre-existing React Compiler warnings remain)
- [ ] `/qa-audit` run — not run
- [ ] Renders in **both** light and dark — not visually verified
- [ ] Reconciled against Figma frame — n/a, no frame for this state

## Notes / follow-ups
- The API tests for this change could not be executed here: the `sqlite` PDO
  driver is missing and the MySQL fallback needs DB credentials this session does
  not have. `./vendor/bin/pint` passes and `php artisan route:list` shows
  `POST api/v1/products/bulk/status → bulkSetStatus`; run
  `php artisan test --filter=ProductBulkActionsTest` before landing.
- The **toolbar's bulk** Deactive / Lock Price / Show Price stay one-directional
  by design — a selection can hold rows in either state, so there is no single
  state to invert. Only the row menu, which has exactly one row to read, toggles.
