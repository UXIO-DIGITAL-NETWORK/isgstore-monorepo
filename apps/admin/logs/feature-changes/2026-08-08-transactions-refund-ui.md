# 2026-08-08 — Transactions Refund UI

**Scope:** transactions row action menu (Refund)
**Type:** feat
**Author/agent:** you

## What changed
- Added a "Refund" row action to `RowActionMenu`, gated by `<Can permission="transactions.refund">`, placed in the destructive cluster above Delete.
- New `RefundDialog` (RHF + Zod) collecting a **required reason**; confirm fires `useRefund()` (the pre-existing service + hook that had no UI trigger — was orphaned).
- New `refund.schema.ts` (`reason` trimmed, min 1).
- Updated the Automatic page menu-order test (7 → 8 items) and added page + component tests for the reason-required gate.

## Why
- `product_requirements.md §4.3` lists Refund as a required operator action (confirmation + reason). Audit (2026-08-08) found `transactionsService.refund()` + `useRefund()` already built and tested but unreachable from the UI. This wires the missing surface only.

## Files touched
- `src/features/transactions/schemas/refund.schema.ts` (new)
- `src/features/transactions/components/RefundDialog.tsx` (new)
- `src/features/transactions/components/RefundDialog.test.tsx` (new)
- `src/features/transactions/components/RowActionMenu.tsx`
- `src/features/transactions/tests/AutomaticTransactionsPage.test.tsx`

## Verification
- [x] Built TDD-first: reason-required gate asserted before wiring the service call
- [x] `npm run test` passes (65 files, 397 tests; +4 from baseline 393)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 9 pre-existing TanStack Table warnings)
- [ ] Renders in **both** light and dark (pending manual chrome-devtools pass)
- [ ] Reconciled against Figma frame (Figma unreachable this session — dialog follows the DeleteConfirmDialog pattern)

## Notes / follow-ups
- Refund endpoint assumed `POST /v1/transactions/{id}/refund` (already in the service); confirm with backend.
- Next gates per plan: P1b Resend Receipt, P1c Export, P1d Recap.
