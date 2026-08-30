# 2026-08-31 — Payment and Provider status become two columns

**Scope:** `transactions` (types, service, columns, filter bar, detail dialog); `src/test/fakeApi.ts`
**Type:** feat
**Author/agent:** you

## What changed

- The single **Status** column is gone. In its place, two independently labelled
  columns: **Payment** (the gateway's verdict) and **Provider** (the supplier's).
  Same in `automaticColumns` and `manualColumns`.
- Two new unions in `transaction.type.ts`: `PaymentStatus`
  (`pending | success | expired | refunded | none`) and `ProviderStatus`
  (eight states). `Transaction.payment_status` narrows from the shared
  `TransactionStatus` to `PaymentStatus`, and `provider_status` is new.
- Two new badges, `PaymentStatusBadge` and `ProviderStatusBadge`. `StatusBadge`
  is untouched — it still renders the combined order status in the edit form and
  the detail dialog.
- `PAYMENT_STATUS_OPTIONS` stops being an alias of `INVOICE_STATUS_OPTIONS` and
  gets its own five entries; `PROVIDER_STATUS_OPTIONS` is new. The filter bar
  gains a **Provider Status** select next to the two it had.
- `toListParams` now serializes `paymentStatus` (and the new `providerStatus`).
- The Time column's outcome line reads the provider lifecycle instead of
  `invoice_status`.
- The detail dialog shows three labelled rows — Order / Payment / Provider — and
  the raw uxiotopup wording is relabelled "Provider Status (raw)".
- `fakeApi` serves both new fields, except on the one gateway-less row, which
  keeps them absent on purpose.

## Why

- **The old column named neither half.** It already stacked two badges — a green
  "Success" over an amber "Processing" — but nothing on screen said which was the
  payment and which was the supplier. Two columns is what was actually asked for,
  and it makes each half sortable and filterable on its own.
- **The Payment Status filter was dead.** The dropdown has shipped for a while,
  but `toListParams` never serialized it and the API had no parameter to receive
  it, so picking a value changed local state and nothing else. Both ends are now
  wired.
- **The two vocabularies were never the same.** Sharing one union is what let the
  Payment dropdown offer "Processing" and "Partial Success", neither of which a
  payment can ever be. Narrowing the type surfaced every place they had been
  conflated.
- **`none` is a real answer.** An admin-created or manually recorded order never
  went through a gateway at all; folding that into "unpaid" made the Manual tab's
  payment column meaningless.
- **The Time column had a live bug.** `outcomeFailed` only tested for `"failed"`,
  so a `refunded` transaction rendered a green **"Success"**. It now reads the
  provider lifecycle, which is what "resolved" means here, with a separate
  "Expired" outcome for a payment that never reached the supplier.

## Files touched

- `src/features/transactions/types/transaction.type.ts`
- `src/features/transactions/services/transactions.service.ts`
- `src/features/transactions/components/{PaymentStatusBadge,ProviderStatusBadge}.tsx` (new, + colocated test)
- `src/features/transactions/components/{automaticColumns,manualColumns,TransactionFilterBar,TransactionDetailDialog,StatusPills}.tsx`
- `src/features/transactions/data/{select-options,transactions}.data.ts`
- `src/features/transactions/tests/{transactions.service,AutomaticTransactionsPage}.test.tsx`
- `src/test/fakeApi.ts`

## Verification

- [x] `npm run test` — 559 passed (88 files), up from 539
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (the 11 `react-hooks/incompatible-library` warnings are pre-existing)
- [x] Tokens only — the one new accent is `chart-1` for `unconfirmed`
- [ ] Reconciled against Figma — no frame exists for the split yet

## Notes / follow-ups

- **Runs correctly against an API that predates the split.** Every new field is
  optional on `TransactionApiRow` and falls back: payment status to the numeric
  code on the nested payment row, provider status to a fold of the order status.
  `fakeApi` keeps one row without the new fields so that path stays tested.
- Two stale expectations were updated rather than the code: a gateway-less order
  now maps to `none` instead of `pending`, and the column-header test asserts
  `Payment`/`Provider` instead of a single `Status`.
- The status pills still filter on `invoiceStatus`, so the Invoice Status select
  stays in the filter bar (three status dropdowns now). Repointing the pills at
  the provider lifecycle is a reasonable follow-up but changes what the counts
  mean, so it was left out of this change.
