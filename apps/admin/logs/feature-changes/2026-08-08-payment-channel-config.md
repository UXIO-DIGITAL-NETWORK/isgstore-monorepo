# 2026-08-08 — Payment channel configuration

**Scope:** administration → Payment
**Type:** feat
**Author/agent:** you

## What changed
- `PaymentChannelListPage` gains an Action column with `PaymentChannelRowActions`: Edit (fee form), Activate/Deactivate toggle, Delete — `<Can>`-gated.
- `EditPaymentChannelDialog` (RHF + Zod, `valueAsNumber`): fee_flat ≥ 0, fee_percent 0–100, min_amount ≥ 0. Uses the existing `useUpdatePaymentChannel` (and `paymentChannelsService.update`).
- Toggle sends `{ is_active: !current }` through the same update service.

## Why
- The page was list + bulk-delete only; PRD §5 expects enable/disable + fee configuration. The service already supported `update()` — this surfaces it in the UI.

## Files touched
- `src/features/administration/schemas/paymentChannel.schema.ts`
- `src/features/administration/components/{EditPaymentChannelDialog,PaymentChannelRowActions}.tsx` (+ EditPaymentChannelDialog.test.tsx)
- `src/features/administration/pages/PaymentChannelListPage.tsx`
- tests: `administration-routes.test.tsx`

## Verification
- [x] TDD-first; full suite green; `tsc -b` clean; lint 0 errors
- [ ] Manual light/dark pass
