# 2026-08-08 — Transactions: Resend Receipt, Export, Recap

**Scope:** transactions (row menu, toolbar, recap dialog)
**Type:** feat
**Author/agent:** you

## What changed
- **Resend Receipt** — new distinct row action + `transactionsService.resendReceipt` (`POST /v1/transactions/{id}/resend-receipt`) + `useResendReceipt`. "View Invoice" stays a separate (placeholder) action.
- **Export** — `transactionsService.exportTransactions(params)` (blob, drops pagination, honours filters) + `ExportButton` (gated `transactions.export`) in Automatic + Manual headers; `downloadBlob` util.
- **Recap** — `transactionsService.getRecap(period)` (`/v1/transactions/recap`) + `RecapDialog` (daily/monthly, breakdown table, totals footer, client-side CSV via `recapCsv`) launched from `RecapButton`.

## Why
- All three are required operator surfaces in `product_requirements.md §4.3` that were absent (Export/Recap) or a placeholder toast (Receipt). Endpoints assumed on the `/v1` contract; services are the one-file swap seam.

## Files touched
- `src/features/transactions/services/transactions.service.ts`, `hooks/useTransactions.ts`
- `src/features/transactions/components/{ExportButton,RecapButton,RecapDialog}.tsx`, `RowActionMenu.tsx`
- `src/features/transactions/lib/{downloadBlob,recapCsv}.ts` (+ `recapCsv.test.ts`)
- `src/features/transactions/pages/{Automatic,Manual}TransactionsPage.tsx`, `types/transaction.type.ts`
- tests: `AutomaticTransactionsPage.test.tsx`, `transactions.service.test.ts`

## Verification
- [x] TDD-first; `npm run test` green; `tsc -b` clean; lint 0 errors
- [ ] Manual light/dark + Figma reconcile (Export/Recap placement flagged TBD in §4.3 — pending Figma)

## Notes / follow-ups
- Export is CSV-only for now (Excel when the endpoint offers it). Recap CSV is built client-side to avoid a second endpoint.
