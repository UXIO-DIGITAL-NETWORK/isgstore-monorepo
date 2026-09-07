# 2026-09-03 — Margins on the Main Products form

**Scope:** `products` (Main Product form dialog)
**Type:** feat
**Author/agent:** you

## What changed

- The form's five fixed money fields (Cost / Public / VIP / Reseller / Agent) are replaced by a **margin percent per membership plan**, plus a selling-price window, with a live preview of the resulting price per plan.
- `useSetProductMargin` / `productsService.setMargin` call `POST /v1/products/{id}/profit-margin`. Saving is two sequenced calls: the product row, then the prices its margins produce.
- `productForm.schema.ts` gains `marginPercent()` — margins may be **negative** (a loss-leader is a decision an admin can make; the API accepts -100..1000), so it cannot reuse the digits-only `percent()`.
- Product Mix rows now pick a **main product** rather than a supplier product.

## Why

- The five money columns were never written by anything, and they could not describe a membership plan an admin created — which is how pricing actually works now. The cost is the supplier's, not something typed on this form.
- **Sequenced, not parallel:** a rejected product write must never leave prices behind.
- **A failed price write leaves the dialog open.** The product exists but is unpriced; closing would hide that and the admin would have to reopen the row to discover it.

## Files touched

- `src/features/products/components/{MainProductFormDialog,ProductMixBuilder}.tsx`
- `src/features/products/{hooks,services,schemas,types}/*`
- `src/features/products/tests/{AddMainProductPage,MainProductRowActions}.test.tsx`

## Verification

- [x] `npm run test` passes (94 files, 597 tests)
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean (0 errors)
- [x] API side green: 996 tests, Pint clean

## Notes / follow-ups

- **The suite is intermittently timing out under parallel load**, in `AddMainProductPage` and `MainProductRowActions`. Unloaded, the slowest test in those files is 1.3s; contended, it passes the local 15s timeout. Two full runs at `maxWorkers=3` were clean, but wall time swung 154s–207s for identical settings, so there is not yet evidence clean enough to re-tune `vitest.config.ts` — whose own comment says to raise the cap only alongside proof the starvation is gone. CI uses 30s and 2 workers, so it may be local-only. Watch the next few CI runs before changing anything.
