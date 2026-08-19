# 2026-08-19 — Product bulk mode: Main Products & Product Provider

**Scope:** `src/features/products/*` (frontend) + `web-topup-api` product/supplier domain (backend)
**Type:** feat
**Author/agent:** you

## What changed

Full-stack bulk capabilities for the two Product tabs, matching the Figma flows.

### Backend (`web-topup-api`)
- **Schema** (`2026_08_19_000001_add_bulk_pricing_fields…`): `suppliers.is_system`; `products.{is_price_locked,is_price_hidden,price_min,price_max}`; `supplier_products.{is_price_locked,margin_member/vip/reseller/agent}`. Seeder flags the Internal System supplier.
- **`PricingService`** now takes per-tier margin overrides and clamps to `price_min/max` (`0/null = no limit`), backward-compatible.
- **Product Provider** (managed): `SupplierProductController@index` gains filters + resource fields (`is_system`, `is_price_locked`, `margins`); single `lock-price` / `profit-margin` / `update` / `delete` (**403 on System**); bulk `lock-price` / `profit-margin` / `delete` (System-skip).
- **Main Products**: single `price-limit`; bulk `lock-price` / `show-price` / `deactivate` / `digiflazz-update` / `delete` (Digiflazz Update recomputes from cost, **skips locked**); `bulk-create` (Add Product Bulk).

### Frontend (`web-admin-topup-fe`)
- Shared **`BulkActionsMenu`** ("N items selected" chip → dropdown) and a `DataTable` `canSelectRow` guard (System rows show a lock, not a checkbox).
- **Product Provider tab redesigned** into a managed list (`ManagedProviderPage`) with row actions (Lock Price, Edit Profit Margin dialog, Delete) and the bulk menu; the Digiflazz price list moved under **Add Product Provider** (`/provider/add`). Bulk **Set Profit Margin** page (`/provider/set-profit-margin?ids=`).
- **Main Products**: toolbar bulk buttons → the bulk menu (Edit Logo, Digiflazz Update, Show Price, Lock Price, Deactive, Delete); row actions wired to real confirm dialogs; **Set Price Limit** page (`/main/set-price-limit?id=`); **Add Product (Bulk)** page (`/main/add-bulk`).

## Why
- The tabs had no bulk mode and several row actions were deferred stubs. This wires them to real endpoints and adds the two dedicated bulk pages from the Figma.
- Locking + limits + margins live on the models the sync already reads, so a locked/limited price and the daily Digiflazz sync never disagree — the sync skips locked rows.

## Deferred (flagged, not built)
- **Edit Product Provider** full edit form (row action).
- **Edit Logo** (Main bulk) — awaits the product image endpoint; stays a labelled stub.
- Add Product Bulk candidates come from the Digiflazz price list (the only live catalogue today); a per-supplier candidate endpoint is a follow-up.

## Verification
- [x] Frontend `npm run test` — 460 passed (82 files); `tsc -b` clean; eslint clean (pre-existing React-compiler warnings only).
- [x] Backend `phpunit` — 495 passed, 1859 assertions (incl. new `PricingServiceMarginTest`, `ProviderProductActionsTest`, `BulkProviderProductActionsTest`, `ProductBulkActionsTest`, `BulkCreateProductsTest`).
- [ ] `/qa-audit` — not run.
