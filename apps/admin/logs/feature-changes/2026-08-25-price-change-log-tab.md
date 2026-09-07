# 2026-08-25 — Price Change Log tab (auto-reprice visibility)

**Scope:** products / new "Price Change Log" tab (`/admin/products/price-log`)
**Type:** feat
**Author/agent:** you

## What changed
- New third tab under Products, **Price Change Log** — a read-only, paginated table
  of what the 5-minute supplier price checker did to each item.
- Rows show the product (name + SKU), cost old→new, member selling price old→new,
  a status badge (`Repriced` / `Locked` / `Deactivated` / `Negative margin`) and the
  change time. `Deactivated` / `Negative margin` rows also render a "Needs attention"
  note so an admin can scan for the ones that need handling.
- Toolbar: search (product name / SKU) + status filter + refresh.
- New data layer: `priceChangeLog.service.ts` (`GET /v1/uxiotopup/price-change-logs`),
  `usePriceChangeLog.ts`, `priceChangeLogColumns.tsx`, `PriceChangeLogPage.tsx`, and the
  `PriceChangeLog` / `PriceChangeStatus` types.

## Why
- The API now **auto-reprices** live products from the margin rules whenever supplier
  cost moves (replacing the old manual price-alert acknowledge flow). Prices changing
  on their own is only safe if the admin can see every change — this tab is that window,
  and it surfaces the rows that still need a human (a SKU switched off at the provider,
  or a margin driven negative by a price cap).
- **Lock Price** is now the mechanism to protect a manually-set price: a locked product
  is not repriced, just logged as `Locked`.

## Files touched
- `src/features/products/pages/PriceChangeLogPage.tsx`
- `src/features/products/components/priceChangeLogColumns.tsx`
- `src/features/products/services/priceChangeLog.service.ts`
- `src/features/products/hooks/usePriceChangeLog.ts`
- `src/features/products/types/product.type.ts`
- `src/features/products/layouts/ProductTabsLayout.tsx`
- `src/features/products/index.ts`
- `src/features/dashboard/components/DashboardNavbar.tsx` (breadcrumb label)
- `src/routes/admin/_protected/products/price-log/index.tsx`
- `src/routes/admin/_preview/products-preview/price-log/index.tsx`
- `src/features/products/tests/PriceChangeLogPage.test.tsx`

## Verification
- [x] Built TDD-first: page test (tab + breadcrumb, repriced row old→new, needs-attention badge, status filter)
- [x] `npm run test` passes
- [x] `tsc -b --force` clean
- [x] `npm run lint` clean

## Notes / follow-ups
- Read-only by design — no acknowledge/mutation. The audit trail is append-only on the API.
