# 2026-07-10 — Transactions UI + routing layer (Automatic + Manual)

**Scope:** transactions (Automatic + Manual tabs) — UI + routing, consuming the already-built data layer
**Type:** feat
**Author/agent:** @frontend

## What changed

- New presentational components in `src/features/transactions/components/`: `StatusBadge`, `StatusPills` (3 clickable filter chips w/ tooltip + counts from `useStatusCounts()`), `TransactionFilterBar` (10-field filter bar, shared by both tabs via a `fields` prop), `automaticColumns`/`manualColumns` (`ColumnDef<Transaction>[]`), `TransactionsTable` (feature-local server-mode table — manual pagination, footer w/ page-size select + `"{from}-{to} of {total} transactions"`), `RowActionMenu` (7-item dropdown, `showCallbackActions` prop hides the 2 provider-callback items for Manual), `EditTransactionDialog` (RHF + Zod, native drag-and-drop dropzone), `DeleteConfirmDialog` (AlertDialog, confirm-gated).
- `src/features/transactions/lib/formatElapsed.ts` — small elapsed-duration formatter (`"1m 23s"` / `"1h 5m"`) for the Time column's badge.
- `src/features/transactions/layouts/TransactionsLayout.tsx` — real tabs (`/transactions/automatic`, `/transactions/manual`) via `Link`, active tab derived from `useLocation().pathname`, `<Outlet/>` for page content.
- `src/features/transactions/pages/{AutomaticTransactionsPage,ManualTransactionsPage}.tsx` — page-local filter/pagination state feeding `useTransactionList(params)`.
- `src/features/transactions/index.ts` barrel; routes under `src/routes/_protected/transactions/` (`route.tsx` gated by `requirePermission("transactions.view")`, `index.tsx` redirects to `/transactions/automatic`, `automatic/index.tsx`, `manual/index.tsx`) plus `src/routes/_preview/transaction-preview/index.tsx` for unauthenticated screen viewing.
- Tests: `src/features/transactions/tests/AutomaticTransactionsPage.test.tsx` (8 cases: header/subcopy, pills, filter labels, table headers, exact-fidelity row, row-menu order, Edit dialog fields, Delete confirm-before-mutate) and `src/features/transactions/tests/transactions-routes.test.tsx` (3 cases: `/transactions` redirect, unauthenticated redirect to `/login`, both tab links present).

## Why

- Mirrors the `financial`/`dashboard` mock-swap seam — consumes the existing typed service/hooks unchanged, no data-layer edits.
- `TransactionsTable` is deliberately **not** a promotion of `dashboard/components/DataTable` (client-mode, different column-alignment convention) — per instructions, transactions needed server-mode (`manualPagination: true`) from the start.
- `RowActionMenu` built identical for every row (success/failed alike) — the flat reference only shows it open on a failed row and Figma access was denied this session, so one consistent 7-item menu was built rather than inventing an unconfirmed second variant.

## Files touched

- `src/features/transactions/lib/formatElapsed.ts`
- `src/features/transactions/components/{StatusBadge,StatusPills,TransactionFilterBar,automaticColumns,manualColumns,TransactionsTable,RowActionMenu,EditTransactionDialog,DeleteConfirmDialog}.tsx`
- `src/features/transactions/layouts/TransactionsLayout.tsx`
- `src/features/transactions/pages/{AutomaticTransactionsPage,ManualTransactionsPage}.tsx`
- `src/features/transactions/index.ts`
- `src/features/transactions/tests/{AutomaticTransactionsPage,transactions-routes}.test.tsx`
- `src/routes/_protected/transactions/{route,index}.tsx`, `src/routes/_protected/transactions/automatic/index.tsx`, `src/routes/_protected/transactions/manual/index.tsx`
- `src/routes/_preview/transaction-preview/index.tsx`
- `src/routeTree.gen.ts` (regenerated via `npx vite build`, not hand-edited)

## Verification

- [x] Built TDD-first: test cases defined, failing tests written (confirmed failing — missing route/module — before implementation), then implemented to green
- [x] `npm run test` passes (75/75, whole suite, after the QA-fix addendum below)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (10 pre-existing errors in untouched `src/components/ui/*` files, confirmed via `git status` out of scope; 2 "Compilation Skipped: incompatible library" warnings on `useReactTable`/RHF `watch`, same accepted pattern as `dashboard/DataTable` — not errors)
- [x] `/qa-audit` run (qa-auditor subagent) — see addendum below
- [x] Renders in both light and dark — visually verified via chrome-devtools against all four reference images (base view, tooltip, row menu, edit modal): header/subcopy/pills/filter-bar/table/row-menu/edit-modal all match
- [x] Reconciled against reference images — **Figma MCP access was denied this session** (no edit/view permission on the file); reconciled against the four flat reference images instead, per the task's own fallback instructions

## QA-audit addendum (post-build pass, same day)

`/qa-audit` (qa-auditor subagent) passed the full Definition of Done with two findings, both fixed before commit:

- **M-1 (fixed):** `EditTransactionDialog`'s Zod validation had no test coverage, and the two `paymentStatus`/`invoiceStatus` `.min(1, ...)` rules are unreachable through the UI (the selects always seed a value, with no clear option). Added a test exercising the one reachable rule — an invalid-type `proofFile` blocks Save and shows the exact error message, `transactionsService.edit` not called. (Note while writing it: `user.upload()` silently no-ops on the visually-hidden file input — switched to `fireEvent.change`, the same documented workaround already used in `FinancialPage.test.tsx` for the clipboard stub.)
- **L-1 (fixed):** the new shared RBAC primitives (`Can`, `useCan`) shipped with no test exercising the non-wildcard "denied" branch — the only place in the app that branch would ever run, since the MVP default is the wildcard. Added `src/hooks/useCan.test.ts` and `src/components/common/Can.test.tsx` (wildcard-grants-all / exact-match-grants / non-match-denies). Also split `useCan` out of `Can.tsx` into `src/hooks/useCan.ts` (global hooks live in `src/hooks/` per `system_architecture.md §3`) — the combined file tripped `react-refresh/only-export-components` (a hook and a component from the same file), which lint caught as a **new** error before this split (distinct from the 10 pre-existing errors in untouched `ui/` files).
- **L-2 (not fixed, out of scope):** `DashboardLayout` still lives under `features/dashboard/layouts/` and is now depended on by a third route tree (`transactions/*`) via a deep import. Flagged after `dashboard` and `financial` too — a promote-to-`components/layouts/` follow-up, not something to fold into this feature's diff.

## Notes / follow-ups (explicitly flagged, not blocking)

- **Manual tab's shape is provisional.** No reference design exists for it (product_requirements.md §4.3); columns drop Target and the reduced filter set (Search/User/Category/Product/Invoice Status/Start/End Date) is this session's judgment call, not a confirmed design.
- **Footer slider omitted.** The reference's unlabeled horizontal slider spanning the table footer has no visible label or wiring, and Figma wasn't reachable to confirm intent — treated as a likely template artifact and left out. Revisit once Figma access is restored.
- **Export/Recap omitted entirely.** Per the brief, these are a genuine open gap this pass (no UI, no new service methods) — not built speculatively, per `product_requirements.md`'s "don't invent" rule.
- **Row menu built identical for every row** (no success/failed variant) — see "Why" above. Revisit if Figma later shows a real second variant.
- **Delete's hard-delete semantics are worth confirming with the team** — hard-deleting a financial transaction record is unusual for audit/compliance reasons. Built exactly as specified (confirm dialog + `remove` mutation) but flagged, not blocking.
- Builds on top of the data layer from `2026-07-10-transactions-data-layer.md` (types/service/hooks/fixtures) — no changes made to those files.
