# 2026-07-30 — Main Products: selection action bar (Digiflazz / Logo / Deactive / Delete)

**Scope:** products / Main Products list (`MainProductToolbar`, `MainProductsPage`) + `DeleteConfirmDialog`
**Type:** feat
**Author/agent:** you

## What changed

- The bulk `Delete (N)` button moved out of the filter row into a right-aligned selection bar below it, rendered only while rows are selected, now holding the reference's four actions in order: `Digiflazz (N)`, `Logo (N)`, `Deactive (N)`, `Delete (N)`.
- `Deactive` is real: `productsService.deactivate(id)` sets `status: "inactive"` (leaving `is_available` alone), `useDeactivateProducts` fans it over the selection with success/error toasts, and it goes through the shared confirmation first.
- `DeleteConfirmDialog` gained optional `confirmLabel` (default `"Delete"`) and `icon` (default trash) so deactivation reuses it instead of a near-copy; every existing caller is unchanged.
- Both mutating actions are `<Can>`-gated (`products.edit` / `products.delete`), which the bulk Delete button previously wasn't.

## Why

- Requested from the supplied reference frame.
- **Open decision — `Digiflazz` and `Logo` do nothing to the data.** Nothing specifies what a bulk provider push or a bulk logo upload does, and both prerequisites (Product Provider tab, an image endpoint) are roadmap §5, so each click raises a `sonner` info toast naming what it waits on rather than guessing a mutation. Marked with a `ponytail:` comment at the handler.
- The button keeps the reference's `Deactive` label; the dialog and toasts use correct English (`Deactivate`, "Product deactivated"), same policy as the other reference-copy corrections in this feature.

## Files touched

- `src/features/products/components/MainProductToolbar.tsx`
- `src/features/products/pages/MainProductsPage.tsx`
- `src/features/products/hooks/useProducts.ts`
- `src/features/products/services/products.service.ts`
- `src/components/common/DeleteConfirmDialog.tsx`
- `src/features/products/tests/MainProductBulkActions.test.tsx` (new)

## Verification

- [x] Built TDD-first: 5 cases written and failing first (bar appears only with a selection, confirm-before-mutate, cancel, singular copy, the two deferred actions touch nothing), then implemented to green
- [x] `npm run test` passes (50 files, 343 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 6 pre-existing `react-hooks/incompatible-library` warnings)
- [x] Driven in the real app via DevTools: select → `Digiflazz (1)` toast, `Deactive (1)` → dialog → confirm → "Product deactivated" and the row's badge flips to `Inactive`
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Token-only styling, so both themes follow
- [ ] Reconciled against Figma frame (reference supplied as an image, not a node)

## Notes / follow-ups

- Wire `Digiflazz` when the Product Provider tab lands, and `Logo` when product images get an upload endpoint; drop `announceDeferred` then.
- No bulk **Activate** counterpart yet — the reference doesn't show one. `deactivate()` becomes a `setStatus(id, status)` when it does.
