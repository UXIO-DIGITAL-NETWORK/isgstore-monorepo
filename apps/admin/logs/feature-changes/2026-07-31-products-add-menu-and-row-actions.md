# 2026-07-31 — Main Products: Add split into Manual/Bulk, full row action menu

**Scope:** products / Main Products list (`MainProductToolbar`, `ProductRowActions`)
**Type:** feat
**Author/agent:** you

## What changed

- "+ Add Main Products" is now a dropdown trigger with two entries: **Manual** (links to the existing `…/main/add` route, still path-relative so the preview twin works) and **Bulk**.
- The row action menu carries the reference's seven entries in order: `Digiflazz Update`, `Show Price`, `Lock Price`, `Set Price Limit`, `Deactive`, `Edit Product`, then a separator and the destructive `Delete`.
- Row-level `Deactive` reuses `useDeactivateProducts` and the shared confirmation (`icon`/`confirmLabel` props added in the previous change), so the row menu and the selection bar deactivate through one mutation.

## Why

- Requested from the two supplied reference frames.
- The reference's menu reads **"Menual"**; corrected to "Manual" — a misspelling of a common word, same class as the lorem-ipsum subcopy and the "9999999" footer already corrected in this feature. (The `Deactive` label is left as the reference has it: it is used consistently as a label there, and the dialog/toasts say "Deactivate".)
- **Open decision — five entries deliberately do not mutate.** `Bulk`, `Digiflazz Update`, `Show Price`, `Lock Price` and `Set Price Limit` each raise a `sonner` info toast naming what they wait on, because nothing specifies their effect and their fields aren't modelled: there is no bulk-import form, no Product Provider tab (§5), no price-visibility or price-lock field, and no price-limit range (the reference's "Price limits: No limit" line). Same treatment as the selection bar's Digiflazz/Logo and the pre-existing `Edit Product` stub.

## Files touched

- `src/features/products/components/MainProductToolbar.tsx`
- `src/features/products/components/ProductRowActions.tsx`
- `src/features/products/tests/MainProductRowActions.test.tsx` (new)
- `src/features/products/tests/MainProductsPage.test.tsx`

## Verification

- [x] Built TDD-first: Add-menu contents + Manual's href, the seven-entry row menu, row deactivate confirm/cancel, and "unspecced entries touch nothing" written failing first, then implemented to green
- [x] `npm run test` passes (51 files, 347 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 6 pre-existing `react-hooks/incompatible-library` warnings)
- [x] Driven in the real app via DevTools: Add menu shows `Manual -> /admin/products-preview/main/add` and `Bulk`; row menu shows all seven; row `Deactive` → dialog → confirm → "Product deactivated" and the badge flips to `Inactive`
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Token-only styling, so both themes follow
- [ ] Reconciled against Figma frame (references supplied as images, not nodes)

## Notes / follow-ups

- Wiring each deferred entry is a one-line swap of its `announceDeferred(...)` handler once the field or screen behind it exists.
- `Show Price` / `Lock Price` imply a per-tier price-visibility flag on `ProductVariant` (the `Public` row's padlock in the price card) — model it with the Add/Edit form, not before.
