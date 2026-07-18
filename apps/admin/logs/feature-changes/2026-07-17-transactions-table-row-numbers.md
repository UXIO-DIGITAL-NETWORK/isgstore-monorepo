# 2026-07-17 — Transactions table: drag-to-reorder removed, row numbers instead

**Scope:** transactions list (`TransactionsTable`, shared by Manual/Automatic pages)
**Type:** refactor
**Author/agent:** you

## What changed
- Removed dnd-kit drag-to-reorder from `TransactionsTable` (`DndContext`/`SortableContext`/`useSortable`, the `SortableRow` wrapper, `orderedData` state, `handleDragEnd`).
- The leading grip-handle column now shows the row's absolute position across pages (`(page - 1) * pageSize + rowIndex + 1`), header labelled `#`.
- Uninstalled `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (no longer used anywhere in the repo).

## Why
- User request: rows should no longer be draggable; replace the drag icon with a row number.

## Files touched
- `src/features/transactions/components/TransactionsTable.tsx`
- `src/features/transactions/tests/AutomaticTransactionsPage.test.tsx`
- `package.json` / `package-lock.json`

## Verification
- [x] Built TDD-first: existing drag-handle test replaced with a row-number assertion before/alongside the implementation change
- [x] `npm run test` passes (132/132, incl. 26 transactions tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (pre-existing React Compiler/TanStack Table warnings only, unrelated to this change)
- [ ] `/qa-audit` run
- [ ] Renders in **both** light and dark (not manually screenshot-verified this pass)
- [ ] Reconciled against Figma frame

## Notes / follow-ups
- None deferred; row selection/reset-on-refetch behavior unchanged.
