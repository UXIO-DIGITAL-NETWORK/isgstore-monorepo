# 2026-09-01 — Refund claims verified against a created account

**Scope:** `refunds`
**Type:** feat
**Author/agent:** you

## What changed

- `RefundsPage` gains the claim queue: a failed payment is now claimed by a customer who creates an account, and the admin verifies that claim before any credit is granted.
- Two new dialogs — `VerifyCreditDialog` (grant the refund as site credit) and `RejectClaimDialog` (refuse it, with a reason the customer sees).
- `refund.type.ts`, `refunds.service.ts` and `useRefunds` follow the API's new claim fields; `RefundStatusBadge` and `refundColumns` render the claim states.

## Why

- The refund scheme changed: money no longer goes back through the gateway. The customer must hold an account for the credit to land in, so the admin's job became *verifying a claim* rather than *pressing refund*.
- Verification is a money-moving action, so it is a confirm dialog with an explicit amount rather than a row action — the same treatment the queue's other terminal actions already had.
- The SLA (2x24 working hours) is shown in the queue so the admin can see what is aging without opening each row.

## Files touched

- `src/features/refunds/components/{VerifyCreditDialog,RejectClaimDialog}.tsx` (new)
- `src/features/refunds/{components,hooks,pages,services,types,tests}/*`

## Verification

- [x] `npm run test` passes
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean (0 errors; the pre-existing `react-hooks/incompatible-library` warnings are unchanged)
- [x] Tokens only, both themes
- [ ] Figma — no frame for this screen

## Notes / follow-ups

- Nothing deferred.
