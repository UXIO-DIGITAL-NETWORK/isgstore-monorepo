# 2026-07-25 — Transaction Activity Log modal

**Scope:** transactions — Activity Log modal, `activity_log` entity field + fixtures/service/hook
**Type:** feat
**Author/agent:** you

## What changed

- **Types** (`types/transaction.type.ts`): added `ActivityLogActor` (`{ name, phone? }`) and `ActivityLogEntry` (`{ id, actor: ActivityLogActor | "system", action, description, created_at }`) per `product_requirements.md` §6, plus a required `activity_log: ActivityLogEntry[]` on `Transaction`.
- **Fixtures** (`data/transactions.data.ts`): the 10 literals + 30 synthetic rows became `TRANSACTION_SEEDS: Omit<Transaction, "activity_log">[]`; `TRANSACTIONS` now maps them through a new `buildActivityLog(row)`. `activitySteps(row, operator)` branches exhaustively on `invoice_status` to produce 2–5 varied entries; `buildActivityLog` spreads their timestamps evenly from the row's own `created_at` to its `resolved_at`.
- **Service/hook**: `transactionsService.getActivityLog(id)` (find/throw, mirroring `getById`) and `useTransactionActivityLog(id, enabled)` on query key `["transactions", "activity-log", id]`.
- **`components/ActivityLogDialog.tsx`** (new): dialog titled "Activity Log" with columns No./User/Action/Description/Time, skeleton loading, "No activity yet." empty state, and an error state with Retry. The table is `table-fixed` with explicit column widths and `overflow-x-visible` on its container, so long Action/Description text wraps onto the next line instead of producing a horizontal scrollbar. The User column renders avatar + name + phone, matching the transactions table's own user cell.
- **`components/RowActionMenu.tsx`**: the "Activity Log" item's `toast("Activity Log — coming soon")` placeholder now opens the dialog. Label and menu order unchanged.
- **`src/utils/initials.ts`** (new, + test): promoted the avatar-fallback helper that was copy-pasted in `automaticColumns.tsx` and `manualColumns.tsx`; both now import it. (A third copy still lives in `dashboard/ActivityFeedCard.tsx` — left alone, different feature.)

### Two unrelated pre-existing defects fixed to unblock this

- **`pages/{Automatic,Manual}TransactionsPage.tsx`**: commit `11e4238` seeded the date filter as `startDate = endDate = new Date().toISOString()`. The service compares `created_at` against those as raw ISO strings, so an identical start/end **instant** is a zero-width window matching nothing — the table was permanently empty. Now `startOfDay(now)`/`endOfDay(now)`. This had left 8 tests failing on `main`.
- **`vitest.config.ts`**: `testTimeout: 15_000`. The default 5s budget made the suite flaky under the default worker pool (bare timeouts in whichever file lost the CPU race, including files untouched here). 3× clean runs after.

## Why

- §4.3 confirmed the Activity Log modal's shape on 2026-07-13; the row-menu item had been a placeholder toast since the original transactions build.
- **The reference image's Action/Description values were deliberately not reproduced.** Its two example rows are byte-identical, and both put the parent transaction's own product name ("19 Diamond (17 + 2 Bonus)" / "Mobile Legends Indonesia") in **Action** and its target reference ("1453734892(16057)") in **Description** — values already visible in the row the modal was opened from, i.e. unvaried template content that was never customised, not confirmed column semantics. The PRD explicitly flags this and directs the reinterpretation. The table structure (No./User/Action/Description/Time) is kept exactly as drawn; only the example values are reinterpreted.
- **Mock event vocabulary used instead** — Action as a short event label, Description as that event's specific detail:
  | Action | Description | Actor |
  | --- | --- | --- |
  | `Invoice Created` | `Invoice {invoice_no} created for {product}.` | system |
  | `Payment Received` | `Payment of {cost} confirmed via {method}.` | system |
  | `Payment Pending` | `Awaiting payment via {method}.` | system |
  | `Order Forwarded` | `Order forwarded to the provider for {game}, awaiting fulfilment.` | system |
  | `Callback Received` | `Callback received from provider, HTTP 200 OK.` | system |
  | `Provider Error` | `Provider returned HTTP 502, top-up was not delivered.` | system |
  | `Status Changed` | `Status changed from Processing to Success.` (Failed / Pending→Success variants) | system |
  | `Callback Resent` | `Callback resent to the provider for reconciliation.` | customer |
  | `Refund Issued` | `Partial refund issued to {customer} for the undelivered items.` | customer |
  | `Manually Edited` | `Invoice status set to Partial Success after operator review.` | customer |
  Sequences are per-status, so a `pending` row gets 2 entries and a `failed` row 5. Nothing is randomised and `Date.now()` is never used — the contract test asserts exact timestamps.
- **The User column shows the parent transaction's own customer on every entry** (avatar + name + phone), not a "System" pseudo-actor — confirmed against a second reference image on 2026-07-25. The reference repeats the same user on every row, so the column identifies *whose transaction the trail belongs to*, not who performed each event. `"system"` stays in the `ActivityLogEntry["actor"]` union per §6 (the real API is documented to send it) and `ActorCell` still renders it, but no fixture produces one.
- The modal's subcopy in the reference is the unedited shadcn dialog template default ("Set the dimentions for the layer."), the same artifact already corrected on the Edit Transaction modal. Replaced with "A record of every status change and action taken on this transaction."
- Time renders as `MMM d, HH:mm:ss` — the app's existing date-fns styling, **plus seconds**, because several entries for one transaction can fall inside the same minute (txn-1 resolves 83s after creation) and would otherwise render as identical timestamps. Chosen over the table's `MMM d, HH:mm` and over the reference's `1 Jul 2026, 14.56.37`, which uses a date style found nowhere else in the app.
- A `"system"` actor, if one ever arrives from the API, renders as an icon avatar (lucide `Bot`) + a single muted "System" line with no phone, so it stays visually distinct from a named user.
- Left ungated by `<Can>`: read-only view, matching the item's prior state. `activity_log` is provisional pending the real API contract.

## Files touched

- `src/features/transactions/types/transaction.type.ts`
- `src/features/transactions/data/transactions.data.ts`
- `src/features/transactions/services/transactions.service.ts`
- `src/features/transactions/hooks/useTransactions.ts`
- `src/features/transactions/components/ActivityLogDialog.tsx` (new)
- `src/features/transactions/components/RowActionMenu.tsx`
- `src/features/transactions/components/{automatic,manual}Columns.tsx`
- `src/features/transactions/pages/{Automatic,Manual}TransactionsPage.tsx`
- `src/utils/initials.ts` + `src/utils/initials.test.ts` (new)
- `src/features/transactions/tests/{transactions.service,AutomaticTransactionsPage}.test.tsx`
- `vitest.config.ts`

## Verification

- [x] Built TDD-first: 8 test cases defined, written failing, confirmed failing for the right reason (`getActivityLog is not a function`, `row.activity_log` undefined, dialog query timing out because the menu item still fired a toast), then implemented to green
- [x] `npm run test` passes — 143/143, 3 consecutive clean runs
- [x] `npx tsc -b --force` clean (the root tsconfig is solution-style, so `--noEmit` checks 0 files here)
- [x] `npm run lint` clean — 0 errors (5 pre-existing React-Compiler warnings on TanStack Table, untouched)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [ ] Renders in **both** light and dark — **not visually confirmed in a browser**; Chrome DevTools MCP could not attach (its profile was held by a running Chrome). Statically verified instead: zero raw hex or palette classes in the new/changed files, and every token used (`--muted`, `--muted-foreground`, `--border`, `--card`) has a monochrome light and dark value in `src/index.css`.
- [ ] Reconciled against Figma frame — `design_system.md` §11 carries no node ID for this modal (only the file key and the two dashboard/component-sheet nodes), so there was nothing specific to reconcile against.

## Notes / follow-ups

- Dialog has no pagination — logs are ≤5 entries per row today. Add it when a real API returns unbounded trails.
- The third `initials()` copy in `dashboard/ActivityFeedCard.tsx` should fold into `@/utils/initials` on a later dashboard pass.
- Now that the default date filter narrows to a single day, each fixture day holds exactly one row. `AutomaticTransactionsPage.test.tsx` pins the clock (`vi.useFakeTimers({ toFake: ["Date"] })`) to 2026-07-01 so it stops depending on the real calendar — otherwise every assertion on the exact-fidelity Jul 1 row silently stops matching.
- Swap `getActivityLog`'s body to `api.get(...)` when the backend lands; the hook and dialog stay unchanged.
