# 2026-08-05 — Product Provider tab (Digiflazz price list → catalog)

**Scope:** products / Product Provider tab (`/admin/products/provider`)
**Type:** feat
**Author/agent:** you

## What changed
- Replaced the "Not designed yet" placeholder on the Product Provider tab with a real screen that browses the Digiflazz price list and adds SKUs into the catalog.
- New data layer under `features/products/`: `provider.service.ts` (`priceList`, `skuPreview`, `add`, `bulkAdd`), `useProviderProducts.ts` hooks, and `DigiflazzPriceListItem`/input types in `product.type.ts`.
- New UI: `ProductProviderPage` (server-paginated `DataTable`, search, prepaid/pasca switch, only-unmapped toggle, row selection), `ProviderToolbar`, `providerColumns`, `AddProviderProductDialog` (category + suggested-price prefill), `BulkAddProviderDialog` (many SKUs under one category), `providerAdd.schema.ts`.
- Backend (`web-topup-api`): new `GET /v1/digiflazz/price-list` (`ListDigiflazzPriceListAction` + `PriceListQueryRequest` + `DigiflazzPriceListItemResource` + controller, reads the cached list, batched `already_mapped`, search/only_unmapped, `LengthAwarePaginator`) and `POST /v1/digiflazz/products/bulk` (`BulkCreateDigiflazzProductsAction`, resilient per-row). Relaxed `StoreDigiflazzProductRequest` prices to nullable so bulk/quick add can defer to `PricingService`.

## Why
- The Digiflazz `price-list` API exposes the products the supplier has published; the admin needed to browse them and turn them into catalog products without hand-entering SKUs. Creating a Product + active Digiflazz `SupplierProduct` mapping is what makes the item appear on the client storefront (via the API's `Catalog`), so no client change was needed.
- Category is always explicit admin input (the backend never guesses one), so the add flow is a dialog, not a silent one-click.
- The list endpoint reads the backend's shared 5-minute cache, honouring Digiflazz's "gunakan secara bijak / simpan di database Anda" rate-limit guidance — paging/searching never hits Digiflazz upstream.

## Files touched
- `src/features/products/services/provider.service.ts`
- `src/features/products/hooks/useProviderProducts.ts`
- `src/features/products/types/product.type.ts`
- `src/features/products/schemas/providerAdd.schema.ts`
- `src/features/products/components/{ProviderToolbar,providerColumns,AddProviderProductDialog,BulkAddProviderDialog}.tsx`
- `src/features/products/pages/ProductProviderPage.tsx`
- `src/features/products/tests/{provider.service,ProductProviderPage,AddProviderProductDialog}.test.tsx`, updated `product-routes.test.tsx`
- `src/test/fakeApi.ts` (digiflazz price-list + sku-preview endpoints)
- `web-topup-api`: routes/api.php + Actions/Requests/Resource/Controller under `Digiflazz`, `StoreDigiflazzProductRequest`, `tests/Feature/Digiflazz/{ListDigiflazzPriceList,BulkCreateDigiflazzProducts}Test.php`

## Verification
- [x] Built TDD-first: service + page + dialog tests
- [x] `npm run test` passes (381)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors)
- [ ] `/qa-audit` run
- [ ] Renders in both light and dark (token-only styling; not yet visually checked)
- [ ] Reconciled against Figma frame (no reference frame exists for this screen)
- Backend: `php artisan test` 210 passing, Pint clean.

## Notes / follow-ups
- No Figma reference exists for this tab — layout follows the Main Products pattern (header + toolbar + DataTable). Reconcile if/when a frame lands.
- Bulk add derives prices from pricing rules; the admin adjusts them afterwards in Main Products. A future enhancement could allow per-tier markup overrides in the bulk dialog.
