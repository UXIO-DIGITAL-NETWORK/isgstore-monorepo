# 2026-07-29 — Status-card filter coverage + filter/table card merge

**Scope:** `features/transactions` — Automatic + Manual history pages, both column sets, the shared filter bar
**Type:** test + style
**Author/agent:** you

## What changed

### 1. Status-card click-to-filter — already built, now pinned by a test

The request was to make clicking a status card (Pending / Partial Refund / Partial Success) filter the table by that status. **It already did.** `StatusPills.onToggle` → `AutomaticTransactionsPage.handleTogglePill` → `filters.invoiceStatus`, which feeds both the `transactionsService.list` query and the filter bar's Invoice Status select. A second click clears it.

No production code changed. What was missing was coverage: the existing pill test asserted only that the three cards render with their counts, never that clicking one does anything. One test case now covers the whole loop — outgoing `invoiceStatus` param, the select following the card, every rendered row carrying that status, and toggle-off.

The clock is pinned to **Jul 5** for that case, because that's the one fixture row carrying `partial_refund` — so the assertion is on real filtered content, not just the params the page sent.

**Test detail worth keeping:** once the filter applies, the Invoice Status select trigger becomes a *second* button reading "Partial Refund". The card element is captured in a variable before the first click and reused for the toggle-off click; re-querying `getByRole("button", { name: /Partial Refund/ })` is ambiguous at that point and throws.

### 2. Filter bar and table merged into one card

They were two sibling `rounded-2xl border border-border bg-card p-4` boxes; now one, with `gap-9` between the filter grid and the table. Applied identically to Automatic and Manual.

Deliberately **no hairline divider** between the two halves — the spacing carries the separation. Add one if the merged card ever reads as cramped.

### 3. Invoice No. sizing + filter-bar spacing

Invoice-number value dropped to `text-sm` (14px) in both `automaticColumns` and `manualColumns`; the `invoice_ref` sub-code below it is untouched. The filter bar's own label/control gaps went `1.5` → `2.5` and its grid gap `3` → `5`.

## Why

- The pill wiring existed but was invisible in the suite — a refactor could have silently broken it. Cheaper to pin than to rediscover.
- One card instead of two removes a border seam between controls and the data they control; they're one surface, not two.

## Files touched

- Modified: `features/transactions/tests/AutomaticTransactionsPage.test.tsx` (1 new case)
- Modified: `features/transactions/pages/AutomaticTransactionsPage.tsx`, `features/transactions/pages/ManualTransactionsPage.tsx` (card merge)
- Modified: `features/transactions/components/automaticColumns.tsx`, `features/transactions/components/manualColumns.tsx` (`text-sm`)
- Modified: `features/transactions/components/TransactionFilterBar.tsx` (spacing)

## Verification

- [x] `npm run test` — 49 files, 336 tests, green
- [x] `npx tsc -b --force` clean; `npm run lint` — 0 errors, 6 warnings (pre-existing TanStack Table, unchanged count)
- [ ] Not opened in-browser this round — changes are Tailwind spacing/size utilities and one wrapper merge, no new visual states
- [ ] `/qa-audit` not run this round

## Notes / follow-ups

- **Known confusion, not fixed:** the status cards show *global* counts (12/32/8, hardcoded in the mock service) while the table is scoped to the page's default **today-only** date filter. On most days no fixture row is `partial_refund`/`partial_success`, so clicking those cards shows "32" above an empty table. Whether a card click should widen the date range is a product rule, not a bug — left alone deliberately.
- The Manual page has no status cards; only Automatic renders `StatusPills`.
