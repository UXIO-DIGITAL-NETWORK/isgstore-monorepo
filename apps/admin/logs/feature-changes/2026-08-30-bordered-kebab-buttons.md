# 2026-08-30 — Bordered kebab (⋮) row-action buttons

**Scope:** all row-action / card-action menu triggers across the admin content area
**Type:** style
**Author/agent:** you

## What changed
- Every three-dot menu trigger went from `variant="ghost"` to `variant="outline"` + `className="rounded-xl"`, so the affordance carries a visible hairline border instead of only appearing on hover.
- Icon swapped `MoreHorizontal` → `MoreVertical` (16 triggers) to match the reference image's vertically stacked dots.
- `ChannelCard` also normalised from `size="icon" className="size-8"` to the shared `size="icon-sm"`.
- Prettier reformatted pre-existing mis-indented blocks in `ProductRowActions`, `ProviderRowActions`, `PricingRulesPage` and `MarketingRowActions` as a side effect — no behaviour change.

## Why
- The bare ghost kebab was invisible at rest in dense tables; a bordered rounded square reads as a button.
- `rounded-xl` and `variant="outline"` are the existing house shape for icon buttons (`ManagedProviderPage:187`, `ExportButton`, `RecapButton`) — reused rather than introducing a new trigger component.

## Files touched
- `src/features/{transactions,administration,content,feedback,marketing}/components/*RowActions.tsx` / `RowActionMenu.tsx`
- `src/features/categories/components/{Category,SubCategory,CategoryType,CategoryServer,CategoryProvider}RowActions.tsx`
- `src/features/products/components/{Product,Provider}RowActions.tsx`
- `src/features/integration/components/ChannelCard.tsx`
- `src/features/pricing/pages/PricingRulesPage.tsx`, `src/features/membership/pages/MembershipListPage.tsx`
- `src/features/refunds/components/RowActionMenu.tsx` (arrived in the same pull, folded in)

## Verification
- [x] `npm run test` passes (85 files, 521 tests) — no test asserted the `ghost` variant
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 10 pre-existing react-compiler warnings)
- [ ] Renders in **both** light and dark — needs an eyeball pass in the running app

## Notes / follow-ups
- Out of scope on purpose: `BulkActionsMenu` (already outlined, labelled pill) and the `pagination`/`breadcrumb` ellipsis (non-interactive overflow indicators).
