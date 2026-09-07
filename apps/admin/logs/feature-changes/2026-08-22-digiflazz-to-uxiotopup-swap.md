# 2026-08-22 — Digiflazz → Uxiotopup supplier swap

**Scope:** products (Provider tab, Main Products bulk actions), financial (suppliers), integration (channels), categories (provider options, nickname check)
**Type:** refactor
**Author/agent:** @api + @frontend

## What changed
- All `/v1/digiflazz/*` calls now target `/v1/uxiotopup/*`; `POST /v1/products/bulk/digiflazz-update` → `bulk/uxiotopup-update`.
- Uxiotopup is prepaid-only: the `type` (`prepaid|pasca`) parameter is gone from the price list, SKU preview, single add, and bulk add. The Provider toolbar's Prepaid/Postpaid select was removed.
- Price-list row reshaped to the uxiotopup contract (`buyer_sku_code`, `name`, `category`, `cost`, `harga`/`harga_gold`/`harga_silver`/`harga_pro`, `available`, `already_mapped`); dropped Digiflazz-only fields (brand, seller, stock, cut-offs, commission…). The provider table lost its Stock column and brand subline accordingly.
- Types renamed: `Digiflazz*` → `Uxiotopup*` (`UxiotopupPriceListItem`, `UxiotopupPriceListParams`, `UxiotopupSkuPreview`, `AddUxiotopupProductInput`, `BulkAddUxiotopupInput`, `BulkAddUxiotopupResult`); hooks `useUxiotopupPriceList` / `useUxiotopupSkuPreview` / `useAddUxiotopupProduct` / `useBulkAddUxiotopupProducts` / `useUxiotopupUpdateProducts`; query keys `["uxiotopup", …]`.
- UI labels "Digiflazz Update" → "Uxiotopup Update" (row menu + bulk menu).
- Cek-username via supplier removed: `useCekUsernameSkuOptions` and `useProductOptions` (src/hooks) deleted; `NicknameCheckField` is now a master switch + lookup-URL input only (`digiflazz:{sku}` / `product:{id}` values no longer exist).
- Fixtures: financial suppliers → single "Uxiotopup" (+ Zelpoint, Topupkuy); integration channels → one `uxiotopup` supplier channel (`mode: "production"`), 6 channels total (3/2/1, 5 connected / 1 disconnected); category-provider fixtures and options re-seeded on the three real suppliers; fakeApi serves `/v1/uxiotopup/*` with the new row shape.

## Why
- The Laravel backend fully migrated from Digiflazz to uxiotopup; Digiflazz endpoints no longer exist. Uxiotopup has no postpaid catalogue and no cek-username API, so both concepts were removed rather than stubbed.

## Files touched
- `src/features/products/{types/product.type.ts, services/provider.service.ts, services/products.service.ts, hooks/useProviderProducts.ts, hooks/useProducts.ts, components/{ProviderToolbar,providerColumns,AddProviderProductDialog,BulkAddProviderDialog,MainProductToolbar,ProductRowActions}.tsx, pages/{ProductProviderPage,MainProductAddBulkPage,MainProductsPage,ManagedProviderPage}.tsx, schemas/providerAdd.schema.ts, data/select-options.data.ts}` + tests
- `src/features/financial/{data/suppliers.data.ts, services/financial.service.ts, types/financial.type.ts}` + tests
- `src/features/integration/data/channels.data.ts` + tests
- `src/features/categories/{components/NicknameCheckField.tsx, data/select-options.data.ts}` + tests
- `src/hooks/useCekUsernameSkuOptions.ts`, `src/hooks/useProductOptions.ts` (deleted)
- `src/test/{fakeApi.ts, fixtures/category-providers.data.ts}`
- `src/routes/admin/_protected/products/provider/add/index.tsx` (comment)

## Verification
- [x] `npx vitest run` passes — 83 files, 470 tests
- [x] `npx tsc -b --noEmit` clean
- [x] `grep -ri digiflazz src/` returns zero results

## Notes / follow-ups
- `check-status` now 400s with "Transaksi belum memiliki ID order uxiotopup — menunggu callback dari supplier." for transactions without a supplier order id; the admin has no dedicated handling for that copy (generic error toast covers it).
- Balance payload changed to `{saldo}` server-side; the admin reads balances via `/v1/financial/suppliers` and `/v1/integration/channels`, which are unaffected.
