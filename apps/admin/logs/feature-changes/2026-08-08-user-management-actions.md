# 2026-08-08 — User management actions

**Scope:** administration → Users
**Type:** feat
**Author/agent:** you

## What changed
- `AdminUser` gains a `status` (`active|suspended|banned`, defaults active); new `BalanceAdjustmentInput`.
- Services: `usersService.adjustBalance(id, {amount,direction,reason})` (`POST /v1/users/{id}/balance-adjustments`, reason required) and `setStatus(id, status)` (`POST /v1/users/{id}/status`).
- Hooks: `useAdjustBalance`, `useSetUserStatus` (+ existing `useDeleteUsers` now wired).
- `UserListPage` gains Status + Action columns; `UserRowActions` menu: Adjust Balance (audited dialog), Suspend/Ban (or Reactivate), Delete — each `<Can>`-gated. Subcopy updated (no longer "read-only").
- `AdjustBalanceDialog` (RHF + Zod): direction, positive amount, required reason.

## Why
- PRD §5 requires managing consumer users (wallet adjust, suspend/ban); the page was read-only. Balance moves go through a dedicated audited endpoint with a mandatory reason.

## Files touched
- `src/features/administration/types/administration.type.ts`, `services/administration.service.ts`, `hooks/useAdministration.ts`
- `src/features/administration/schemas/balanceAdjustment.schema.ts`
- `src/features/administration/components/{AdjustBalanceDialog,UserRowActions}.tsx` (+ AdjustBalanceDialog.test.tsx)
- `src/features/administration/pages/UserListPage.tsx`
- tests: `administration-routes.test.tsx`, `administration.service.test.ts`

## Verification
- [x] TDD-first; full suite green; `tsc -b` clean; lint 0 errors
- [ ] Manual light/dark pass

## Notes / follow-ups
- Balance-adjust / status endpoints assumed on the `/v1` contract — confirm with backend.
- Gotcha recorded: never put a native `min` on a number input behind Zod — it blocks form submit before RHF validates, so the Zod error never renders. Use `valueAsNumber` + `z.number()`.
