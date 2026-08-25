# 2026-08-25 — Set Profit Margin loading skeleton

**Scope:** products / Set Profit Margin (`ProviderMarginBulkPage`)
**Type:** a11y
**Author/agent:** you

## What changed
- The left product column now shows skeleton cards while the selected provider
  products are being fetched, instead of rendering nothing and flashing the
  "No selected products to show." empty state during the load.
- Skeleton count matches the selection size from the URL (`ids.length`), clamped
  to 8. Each skeleton card mirrors the real card shell (category·code line,
  product-name line, price block).
- Empty state is now gated on `!isLoading` so it only appears once the fetch has
  genuinely resolved empty.

## Why
- Admins had no signal that products were still loading — it looked like the
  selection had been lost. Covers both "single" (`?ids=2`) and "bulk"
  (`?ids=1,2,3`); they are the same component.
- Reuses the existing `Skeleton` primitive and the `DataTable` loading pattern —
  no new components.

## Files touched
- `src/features/products/pages/ProviderMarginBulkPage.tsx`
- `src/features/products/tests/ProviderMarginBulkPage.test.tsx`

## Verification
- [x] Built TDD-first: skeleton test written first, then implemented to green
- [x] `npm run test` passes (3/3 in ProviderMarginBulkPage)
- [x] `npx tsc --noEmit` clean (`tsc -b --force`, exit 0)
- [x] `npm run lint` clean (changed files, exit 0)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Renders in **both** light and dark (tokens only — `bg-accent` via Skeleton)
- [ ] Reconciled against Figma frame (no frame for this screen)

## Notes / follow-ups
- No error state added here (out of scope); the page still assumes a successful
  fetch beyond the empty case. Consider an error/retry state if the endpoint
  proves flaky, matching `DataTable`'s `isError` branch.
