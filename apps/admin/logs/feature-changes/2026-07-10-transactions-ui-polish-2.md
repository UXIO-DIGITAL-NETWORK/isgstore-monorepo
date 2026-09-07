# 2026-07-10 — Transactions Automatic/Manual tab UI polish, round 2 (5 changes)

**Scope:** transactions (Automatic + Manual, shared table/pill components) — second UI/UX polish pass on top of the already-built and previously-polished feature
**Type:** feat
**Author/agent:** you (main thread) — clarifying questions asked via `AskUserQuestion` before implementation for the genuinely ambiguous items (sorting scope/columns, selection scope, drag-reorder persistence/dependency)

## What changed

1. **Status pills — permanent tint + hover transition.** `StatusPills.tsx`: the color-coded tinted background (`bg-warning/10` etc.) is now always on, not only when the pill is the active filter; added `hover:bg-*/15` + `transition-colors duration-200` for a smooth hover shift. Active state now layers a stronger `ring-2 ring-*/30 bg-*/20` on top of the same color instead of being the only source of color.
2. **Radius consistency.** Every page-level card container (header, filter bar, table wrapper) and the status pills now share `rounded-2xl`, matching the table card the user pointed at as the reference (was a mix of `rounded-xl`/`rounded-2xl` after round 1).
3. **Table: sort, select-all/select-row, drag-to-reorder.**
   - **Sorting** is real and service-backed (not visual-only, per explicit decision) — `TransactionListParams` gained `sortBy`/`sortDir`, `transactions.service.ts` gained a `SORTERS` map + `sortRows()`, sorting state is lifted to both pages (`AutomaticTransactionsPage`/`ManualTransactionsPage`) and included in query params. All 8 real columns are sortable (Action excluded); clicking a header cycles asc → desc → none.
   - **Row selection** (header "select all" + per-row checkboxes) is UI-only per explicit decision — no bulk-action bar, since the reference doesn't show one and building one now would be inventing scope.
   - **Drag-to-reorder** uses `@dnd-kit/core` + `@dnd-kit/sortable` (new dependency, explicitly approved) — client-only, resets whenever the table's `data` prop changes (new page/filter/sort), since persisting a manual order for a financial transaction list has no real backend meaning. Keyboard-accessible (Space to pick up, arrows to move, Space to drop, Escape to cancel) via dnd-kit's `KeyboardSensor`; announces moves via an ARIA live region automatically.
4. **Processing badge is now warning-colored**, and every `StatusBadge` variant's border now matches its text color (previously the shadcn `outline` Badge variant always rendered a neutral gray border regardless of the text color).
5. **Colorized sub-text**: Cost column's "Profit: X" value → `text-success`, Method column's "Admin fee: X" value → `text-warning` (both fixed/always-on colors, not conditional on the row's outcome — the reference showed identical coloring on both a success and a failed example row). Time column's resolved-timestamp line → conditional `text-success`/`text-destructive` matching that row's actual Success/Failed outcome (its label already alternated per row).

## Why

- All 5 items came from 4 new reference images. Items 3 and 5 had genuine open decisions (sort scope, selection scope, drag persistence + dependency choice, fixed-vs-conditional coloring) — surfaced via `AskUserQuestion` rather than guessed, per project rules against inventing behavior.
- Real (not cosmetic) sorting was chosen because system_architecture.md §4.8 already establishes this table as server-mode/server-driven — a visual-only sort would have been throwaway UI needing a rebuild later.
- Drag reorder is deliberately non-persisted: reordering rows in a financial transaction history has no defined business meaning, so persisting it would be inventing a feature rather than matching the reference's visual affordance.

## Files touched

- `src/index.css` — no new tokens this pass (`--warning` already existed from round 1); reused for the Processing badge.
- `src/features/transactions/components/StatusPills.tsx` — permanent tint, hover transition, `rounded-2xl`.
- `src/features/transactions/components/StatusBadge.tsx` — `STATUS_BADGE_CLASS` (text+border pairs), `processing` → warning.
- `src/features/transactions/components/automaticColumns.tsx`, `manualColumns.tsx` — `enableSorting: false` on Action; colorized Profit/Admin-fee/timestamp sub-text (automatic only — manual has no such sub-lines).
- `src/features/transactions/components/TransactionsTable.tsx` — sort headers, selection column, drag-and-drop rows (dnd-kit), `rounded-2xl` propagation.
- `src/features/transactions/pages/AutomaticTransactionsPage.tsx`, `ManualTransactionsPage.tsx` — lifted `sorting` state, `rounded-2xl` header box.
- `src/features/transactions/types/transaction.type.ts` — `sortBy`/`sortDir` on `TransactionListParams`.
- `src/features/transactions/services/transactions.service.ts` — `SORTERS` map, `sortRows()`.
- `src/features/transactions/data/transactions.data.ts` — unchanged this pass (already ~40 rows from round 1).
- `src/components/ui/table.tsx` — `TableRow` is now `forwardRef` (backward-compatible).
- `src/components/ui/button.tsx` — `Button` is now `forwardRef` (backward-compatible).
- `src/features/transactions/tests/AutomaticTransactionsPage.test.tsx` — added selection, sort-triggers-service-call, and drag-handle-reachability tests.
- `src/features/transactions/tests/transactions.service.test.ts` — added sort-ascending/descending and sort-omitted contract tests.
- `package.json` / `package-lock.json` — added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- `.claude/agent-memory/frontend-engineer/{MEMORY.md,topics/transactions-feature.md,topics/shared-components.md}`.

## Verification

- [x] `npm run test` passes (80/80, whole suite)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (same 10 pre-existing errors in untouched `src/components/ui/*` files; 4 expected "incompatible library" warnings — 3 pre-existing pattern + this pass's own `useReactTable` call in `TransactionsTable`)
- [x] Grepped changed files for raw hex / off-token palette classes / raw HTML tags — empty
- [x] Renders in **both** light and dark — verified via chrome-devtools: pill tint/hover/tooltip, consistent radius, sort-click actually reorders rows (spied + visually confirmed ascending Cost), select-all/select-row checkboxes toggle correctly, keyboard drag-reorder (Space/Arrow/Space) swaps row order and is announced via ARIA live region, Processing badge amber with matching border, Profit/Admin-fee/timestamp colors
- [ ] Reconciled against Figma — still not attempted; Figma MCP access remains denied for this file this session, built against the reference images only (same caveat as round 1)

## Notes / follow-ups

- **A real bug was caught by writing the selection test, not by manual browser testing.** The synthetic `__select` column definition was originally created fresh inside `TransactionsTable`'s render body; since its `cell`/`header` functions got a new identity every render, `flexRender` treated it as a different component and remounted it on every state change — which silently dropped a just-set "checked" state in a test asserting immediately after the click (manual browser verification didn't catch this because a full re-render still lands on the visually-correct end state). Fixed by memoizing the column def and `fullColumns` array with `useMemo`. Documented in `topics/transactions-feature.md` as a general "memoize inline `ColumnDef`s" gotcha.
- Tests were written and run *after* the implementation was already built and manually verified in the browser this pass (rather than strictly failing-tests-first) — the interactive nature of debugging the `getCanSort()`/`accessorFn` issue and the render/remount bug made a live browser + iterative fix loop the faster path to correctness; tests were added immediately after to lock in the behavior and, as noted above, caught a real regression the manual pass had missed. Flagging this transparently rather than presenting it as strict TDD ordering.
- Row selection has no bulk-action bar (explicit decision) — if the team wants bulk delete/export later, that's new scope requiring its own confirm-dialog/permission-gating work per the RBAC rule for destructive actions.
- Drag-reorder is explicitly non-persisted — flagging again in case a future ask assumes otherwise.
