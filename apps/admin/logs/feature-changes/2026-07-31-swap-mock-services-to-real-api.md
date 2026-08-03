# 2026-07-31 — Swap all 11 mock services to the real API

**Scope:** categories (×5), products, transactions, dashboard, financial, integration
**Type:** feat
**Author/agent:** @api

## What changed

Every feature service now calls the Laravel API instead of an in-memory fixture array. Each gained an API-row interface and a mapper; hooks, pages and columns are unchanged.

| Service | Endpoint |
|---|---|
| `categoryTypes` | `/v1/category-types` |
| `categories` | `/v1/categories` (multipart) |
| `subCategories` | `/v1/sub-categories` (multipart) |
| `categoryServers` | `/v1/server-categories` + `/v1/server-category-options` |
| `categoryProviders` | `/v1/supplier-categories` |
| `products` | `/v1/products` — **`update` added** (it never existed) |
| `transactions` | `/v1/transactions` + status-counts / refund / resend-callback / retry / manual-review |
| `dashboard` | `/v1/dashboard/{stats,performance}`, `/v1/activity-logs` |
| `financial` | `/v1/financial/{summary,payment-gateways,suppliers}` |
| `integration` | `/v1/integration/channels` |

Supporting changes: `useCategoryOptions` and `useSupplierOptions` feed the forms' selects from the API (the Category Server and Category Provider forms submitted names where the API needs foreign keys); `src/test/fakeApi.ts` stands in for the backend in page tests; the retired fixtures moved to `src/test/fixtures/`.

## API changes this required

- **Missing columns added** (per the "add the field rather than drop it" decision): `category_types.is_voucher`; `sub_categories.currency_name`, `description`; `products.sub_name`, `logo`, `description`, `validasi_nickname`, `access`, `tag`, `is_available`.
- **`activity_logs.transaction_id`** — the per-transaction Activity Log modal was built and tested but the table was a single global feed with no way to scope it. Added as a nullable FK with `nullOnDelete`, populated by the five admin transaction actions, and filterable via `?transaction_id=`.
- **Dashboard**: `net_income` (summed margin) added to the chart series so the second plotted line means something, and `?month=` added so the month selector is a real filter.
- **Query params** on the admin lists (separate entry): `products` ignored `per_page` entirely; `search` was missing on six endpoints.
- `ServerCategoryResource` now eager-loads `options`; `SubCategoryResource` gained `logo_url`.

## Decisions worth recording

- **`order_form_fields` is `{fields, customer_no_template}`, not a bare array.** `customer_no_template` builds the identifier sent to the supplier and is not editable in this UI, so `categoriesService.update` reads the row first and resends it verbatim. Dropping it would make paid orders fail at fulfilment. Covered by a test.
- **Products map 1:1 to a single-variant product.** The API's table is flat (one row per denomination) and the Add form collects no prices, so variants are display-only. The variant is labelled `sub_name ?? "Default"` — the Product column already prints the name, sub-category and code, so reusing any of them printed the same string twice in one row.
- **Status pills retargeted.** They were `pending / partial_refund / partial_success`, but neither partial state exists in `App\Enums\TransactionStatus` — there was no data behind them. They now show `pending / processing / failed`, which is what `/transactions/status-counts` reports. **This changes two visible labels.**
- **`getById` accepts an invoice number.** The edit route is keyed on it; the API binds the numeric id, so a non-numeric ref resolves through a search.
- **Balances are nullable.** Only providers with a live balance integration report a figure; `CopyableAmount` renders an em dash instead of offering "Copy Rp 0" for an unreadable balance.

## Files touched

- `src/features/{categories,products,transactions,dashboard,financial,integration}/services/*.ts` + their tests
- `src/features/categories/hooks/{useCategoryOptions,useSupplierOptions}.ts` (new)
- `src/features/categories/pages/{CategoryServerFormPage,CategoryProviderFormPage}.tsx` + schemas
- `src/features/transactions/components/StatusPills.tsx`, `src/features/financial/components/CopyableAmount.tsx`
- `src/test/{fakeApi.ts,apiEnvelope.ts,fixtures/*}` (new), `src/test/setup.ts`
- (API) 4 migrations, plus the matching DTOs / requests / actions / resources

## Verification

- [x] Built TDD-first: contract tests rewritten against a mocked axios before each swap
- [x] `npm run test` — 53 files, 329 tests
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (7 pre-existing warnings)
- [x] All 16 endpoints the admin now calls verified live against a seeded database (HTTP 200 + shape checks)
- [ ] `/qa-audit` run

## Notes / follow-ups

- `activity_logs` has no seeder in `DatabaseSeeder`, so the dashboard's Recent Activity card and the per-order modal are empty on a fresh database until real admin actions occur.
- The API test suite cannot run here — `phpunit.xml` uses in-memory SQLite and `pdo_sqlite` is not installed.
