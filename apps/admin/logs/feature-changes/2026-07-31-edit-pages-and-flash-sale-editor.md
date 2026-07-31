# 2026-07-31 — Product/category edit pages, flash-sale editor

**Scope:** `features/products`, `features/categories`, `features/marketing`
**Type:** feat
**Author/agent:** @frontend

## What changed

- `AddMainProductPage` → **`MainProductFormPage`**, serving add and edit. New route `/admin/products/main/$productId/edit` (plus its preview twin).
- `AddCategoryPage` → **`CategoryFormPage`**, serving add and edit. New route `/admin/categories/category/$categoryId/edit` (plus preview twin).
- **`FlashSaleFormPage`** — master-detail editor for a sale and its product line-up, at `/admin/flash-sales/add` and `/$flashSaleId/edit`.
- `useUpdateProduct` added — the service gained `update` during the API swap but no hook ever exposed it.

## Selects now carry real foreign keys

Three forms submitted *names* against a hardcoded option list, which the API cannot resolve to a row:

- product Category / Sub Category → `useProductSelectOptions` (sub-categories refetch per chosen category)
- category Category Type → `useCategoryTypeOptions`
- flash-sale Product → `useProductOptions`, which also carries each product's current price so the editor can show what the sale price marks down *from*

## Bug found

`useCategory` had no `enabled` guard. The shared add/edit form calls it with no id on the add route, so it fired `GET /v1/categories/` and threw — the Add Category page rendered nothing. Caught by an existing validation test that suddenly found no error messages.

## Files touched

- `src/features/products/pages/MainProductFormPage.tsx` (replaces AddMainProductPage), `hooks/useProductSelectOptions.ts`, `hooks/useProducts.ts`
- `src/features/categories/pages/CategoryFormPage.tsx` (replaces AddCategoryPage), `hooks/useCategoryTypeOptions.ts`, `hooks/useCategories.ts`
- `src/features/marketing/pages/FlashSaleFormPage.tsx`, `schemas/flashSaleForm.schema.ts`, `hooks/useProductOptions.ts`
- 6 new route files; 2 barrels; 2 tests updated for API-sourced option names

## Verification

- [x] `npm run test` — 57 files, 360 tests
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors
- [x] `npm run build` succeeds
