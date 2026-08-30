# 2026-08-30 — Refunds queue + refunded status vocabulary

**Scope:** new `refunds` feature; `transactions` status vocabulary; sidebar
**Type:** feat
**Author/agent:** you

## What changed

- New `src/features/refunds/`: list page at `/admin/refunds` (+ `/admin/refunds-preview`), service, hooks, columns, filter bar, status/method badges, and four dialogs — detail (read-only), payout details, complete, reject.
- Sidebar gains **Refunds** under **Orders**.
- `transactions`: the local status `partial_refund` is renamed `refunded` and relabelled "Refunded". It was never partial — the API's `REFUNDED` returns the whole `gross_amount`.
- `EDITABLE_INVOICE_STATUS_OPTIONS` splits what an admin may *set* from what they may *filter by*: `refunded` is filterable but no longer settable in the Edit Transaction form.
- `useRefund`'s toasts stop saying "Refund initiated" and now name what actually happened; it also invalidates `["refunds"]`.
- `RefundDialog`'s copy explains the two paths (member balance vs. guest manual transfer).
- `fakeApi` seeds `refunds`, `/v1/refunds/status-counts` and `/v1/payout-banks`; `/v1/transactions/status-counts` gains `refunded`.

## Why

- The API's refund flow was rewritten: automatic gateway refunds are gone. A member is credited to their wallet inline; a guest is queued for a manual bank transfer. That queue had no UI at all — there was no way to answer "whose money have we not sent back yet".
- **`refunded`, not `partial_refund`:** the old name described a state the backend never had, and it read as a partial amount to anyone using the page.
- **Settable ≠ filterable:** `REFUNDED` now asserts that money left. The API rejects it on `manual-review` for that reason, so a dropdown offering it would only ever produce a 422 — or, worse, a claim nobody could substantiate.
- **The bank list is fetched, not copied.** `config/banks.php` was already mirrored by hand into the settlement SPA; a third copy here would have guaranteed drift, so a `GET /v1/payout-banks` endpoint was added on the API side and both the admin form and the storefront claim page read it.

## Files touched

- `src/features/refunds/**` (new)
- `src/features/transactions/{types,services,data,components,hooks}/*`
- `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/routes/admin/_protected/refunds/index.tsx`, `src/routes/admin/_preview/refunds-preview/index.tsx`
- `src/test/fakeApi.ts`

## Verification

- [x] Built TDD-first: service tests then page tests, both written before the components they cover
- [x] `npm run test` passes (539 tests, 87 files)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; the 11 pre-existing `react-hooks/incompatible-library` warnings are unchanged)
- [x] Tokens only — monochrome, color confined to `warning`/`success`/`destructive`/`chart-1`
- [ ] Reconciled against Figma — no frame exists for this screen yet

## Notes / follow-ups

- The detail dialog surfaces a warning when a `COMPLETED` refund has no `settlement_reversed_at`: the customer was refunded but the merchant's settlement could not be un-booked (they had already withdrawn it). There is no in-app action for that yet — it is a "go and talk to the merchant" signal.
- `uxiotopup-payment` still carries its hand-maintained `src/constants/bankCodes.ts`. Migrating it to `/v1/payout-banks` would leave one source of truth.
