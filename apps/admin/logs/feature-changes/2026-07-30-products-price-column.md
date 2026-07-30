# 2026-07-30 — Main Products: `Game` column becomes a per-tier `Price` breakdown

**Scope:** products / Main Products list (`mainProductColumns`, `ProductPriceCell`)
**Type:** feat
**Author/agent:** you

## What changed

- The list's `Game` column is now `Price`, rendering one card per variant: a `Cost` row, then `Public` / `VIP` / `Reseller` / `Agent`, each with its margin in rupiah (`text-success` badge), that margin as a share of the tier's selling price (`text-chart-1` badge) and the tier price itself — the reference card's layout.
- `ProductVariant` replaces `price: number` with `cost_price: number` + `prices: Record<PriceTier, number>`; `PRICE_TIERS`/`PriceTier` are exported from `product.type.ts`.
- Fixtures derive cost and the four tier prices from the retail price via a `priced()` helper in `products.data.ts` (markups reproduce the reference: cost 58.745 -> public 62.857, VIP 60.801, reseller 60.214, agent 59.332).
- The price-bucket filter and the Variant cell now read `prices.public`; the game name is still searched, just no longer shown in a column of its own.

## Why

- Requested: the reference heads that column "Price", and the supplied card shows a cost/tier breakdown — the earlier `Game` rename (2026-07-28) was the correct read of the *old* reference and is reverted by this one.
- **Provisional pending the API contract:** the tier markups live only in the fixtures (`ponytail:` comment marks it) — the real API is expected to return cost and the four prices per variant, so no UI code derives a price. The padlock on `Public` is decorative: what it locks belongs to the Add/Edit form (§5), which is still roadmap.

## Files touched

- `src/features/products/components/ProductPriceCell.tsx` (new)
- `src/features/products/components/mainProductColumns.tsx`
- `src/features/products/types/product.type.ts`
- `src/features/products/data/products.data.ts`
- `src/features/products/services/products.service.ts`
- `src/features/products/pages/MainProductsPage.tsx` (docstring)
- `src/features/products/tests/MainProductsPage.test.tsx`
- `src/features/products/tests/products.service.test.ts`

## Verification

- [x] Built TDD-first: headers/breakdown cases and the fixture margin contract written and failing first, then implemented to green
- [x] `npm run test` passes (49 files, 338 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 6 pre-existing `react-hooks/incompatible-library` warnings in `DataTable`/shadcn)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Renders in **both** light and dark (token-only: `border-border`, `success/10`, `chart-1/10`)
- [ ] Reconciled against Figma frame (reference supplied as an image, not a node)

## Notes / follow-ups

- The Variant cell still repeats the public price next to the card's `Public` row; drop it if the new reference shows the Variant column without a price.
- Cost/tier prices become editable with the Add/Edit Product form (§5).
