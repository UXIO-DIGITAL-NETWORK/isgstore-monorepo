# 2026-08-27 — Transaction Detail dialog (the last "coming soon")

**Scope:** transactions / row action menu + a new read-only detail dialog
**Type:** feat
**Author/agent:** you

## What changed
- `RowActionMenu`'s "Transaction Detail" item now opens a real dialog instead of
  `toast("Transaction Detail — coming soon")`. This was the only live "coming soon"
  string left in the admin.
- New `TransactionDetailDialog` — six read-only groups (Summary, Customer, Order,
  Payment, Supplier, Timing), fed by `useTransactionDetail(id, open)`.
- New `transactionsService.getDetail` + `TransactionDetail` type; `getById`'s
  ref-resolution extracted to a shared `fetchTransactionRow`, and the derivations
  both mappers use (`toCustomer`, `toTargetRef`, `toInvoiceStatus`, `toPaymentStatus`,
  `toGame`, `toProductRef`) pulled out so the table and the dialog cannot drift.
- New shared `src/components/common/CopyButton.tsx` (invoice no, gateway reference,
  supplier trx id / SN).
- Removed `Transaction.status_history` — zero consumers, no backend behind it.
- **API:** `TransactionController` now eager-loads via one `self::RELATIONS` const
  (was the same array repeated at 8 call sites) and that const includes
  `product.category`; same one-word fix in `GetTransactionsAction` and
  `GetDashboardStatsAction`.

## Why
- **The Game column was blank in production, always.** `ProductResource` emits
  `category` only `whenLoaded`, and nothing loaded it — so `game.name` mapped to `""`
  on every row. Fixed at the source rather than worked around in the mapper.
- **A separate `TransactionDetail` type, not a widening of `Transaction`.** `Transaction`
  is the DataTable row and the fixture shape; adding ~12 required fields would force
  every fixture to invent gateway references, and adding them as optional would give the
  dialog no type-level guarantee the data was requested — the exact mechanism that left
  the Game column blank.
- **Three rows render only when they carry information**, all verified against
  `CheckoutAction`: `channel_fee` is hidden when it equals `amount_fee` (they are the
  same number on every row written since the global markup was removed — showing both
  reads as double counting); gateway amount is hidden unless it disagrees with the total;
  promo discount is hidden at 0. `amount_base` is already net of the discount, so the
  discount is labelled as applied rather than shown as a subtraction that would not add
  up on screen.
- **`total_price` is deliberately not mapped** — `CheckoutAction` never writes it, so it
  is 0 on every customer order and would render as a permanent, misleading "Rp 0".
- **`resolved_at`/`elapsed_seconds` are deliberately omitted** — both are derived from
  `updated_at`, so a later admin edit silently rewrites the "resolution time". The
  dialog shows `updated_at` honestly as "Last Update"; the table's badge stays as a
  glanceable approximation.
- Supplier status renders as plain text, not a `StatusBadge` — it is the provider's own
  vocabulary, not a `TransactionStatus`.
- `enabled: open` is load-bearing: the dialog is mounted once per row, so without it
  every visible row would fetch its detail on page load.

## Files touched
- `src/features/transactions/components/{RowActionMenu,TransactionDetailDialog}.tsx` (+ test)
- `src/features/transactions/{services/transactions.service.ts,hooks/useTransactions.ts,types/transaction.type.ts}`
- `src/components/common/CopyButton.tsx` (+ test)
- `src/test/fakeApi.ts` (detail fields derived from the existing fixtures)
- `src/features/transactions/tests/{transactions.service,AutomaticTransactionsPage}.test.tsx`
- api: `app/Http/Controllers/Api/TransactionController.php`,
  `app/Actions/Transaction/GetTransactionsAction.php`,
  `app/Actions/Dashboard/GetDashboardStatsAction.php`,
  `tests/Feature/{TransactionDetailTest,TransactionListTest}.php`

## Verification
- [x] Built TDD-first: failing tests first at every layer (backend, service, component, route)
- [x] `npm run test` passes (521 tests, 85 files)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; only the pre-existing useReactTable/useForm warnings)
- [ ] `php artisan test --filter=Transaction` — **not run locally**: no `pdo_sqlite`
      extension and the MySQL fallback needs credentials this machine does not have.
      CI installs `pdo_sqlite`, so it runs there.
- [x] Tokens only; colour confined to the margin's sign and the status badges

## Notes / follow-ups
- `CopyableAmount` (financial) still duplicates the copy behaviour — fold it onto
  `CopyButton` separately, so this change carries no Financial regression risk.
- A "re-check supplier status" action would fit this dialog well:
  `POST /v1/uxiotopup/check-status` already exists and nothing in the admin calls it.
