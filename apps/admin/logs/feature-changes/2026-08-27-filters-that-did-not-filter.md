# 2026-08-27 — Category filters that silently did not filter

**Scope:** categories / Category + Category Provider toolbars
**Type:** fix
**Author/agent:** you

## What changed
- **Category Type filter:** now fed by `useCategoryTypeOptions()` (live, id-valued)
  instead of the hardcoded `CATEGORY_TYPE_OPTIONS`, and the request param changed from
  `type` to `type_id`.
- **Provider filter:** now fed by `useSupplierOptions()` and sends `supplier_id`;
  `categoryProvidersService.list` no longer folds a provider *name* into `search`.
- Updated the superseded service test to the new spec (not loosened).

## Why
- The Category Type filter **never worked at all**: the admin sent `?type=<name>` while
  the API reads `type_id` (`CategoryController.php:26`), so the parameter was ignored and
  the list came back unfiltered. The frozen three-name list was the second bug, not the
  first — a type created on the Category Type tab could never appear.
- The Provider filter did work, but through `search`, which also matches
  `provider_category` and the category name — so choosing a provider *widened* the
  result set. The API has an exact `supplier_id` filter
  (`GetSupplierCategoriesAction.php:18`); it is now used.
- Both hooks already existed and were already used by the matching form dialogs — the
  toolbars beside them had simply never been migrated.

## Files touched
- `src/features/categories/components/{CategoryToolbar,CategoryProviderToolbar}.tsx`
- `src/features/categories/pages/{CategoryListPage,CategoryProviderPage}.tsx`
- `src/features/categories/services/categoryProviders.service.ts`
- `src/features/categories/types/{category,categoryProvider}.type.ts`
- `src/features/categories/tests/{CategoryListPage,CategoryProviderListPage,categoryProviders.service}.test.*`

## Verification
- [x] Built TDD-first (the new filter tests failed first)
- [x] `npm run test` passes
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean

## Notes / follow-ups
- `CATEGORY_TYPE_OPTIONS` / `PROVIDER_OPTIONS` in `data/select-options.data.ts` now have
  no consumer for these two filters; sweep the remaining frozen option lists in that file
  (`PRICE_RANGE_OPTIONS`, `PRODUCT_TAG_OPTIONS`, …) the next time their screens are touched.
