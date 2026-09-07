# 2026-07-10 — Dashboard UI rebuild (real UDN screen replaces template widgets)

**Scope:** dashboard (shell chrome + main screen)
**Type:** feat
**Author/agent:** @frontend

## What changed
- Replaced the template/demo `dashboard` shell and page with the real UDN admin dashboard: sidebar (brand, search + `⌘F` command palette, 4 nav groups, newsletter footer card), topbar (title, 4 icon actions incl. `ThemeToggle`, user menu with logout), and the 6-region page (welcome banner, 3 stat cards, monthly performance chart, pending orders, recent activity, tabbed performance table).
- Built 6 new generic dashboard components consuming the already-built data layer (`useDashboard` hooks + mock fixtures): `TrendPill`, `StatCard`, `PerformanceChartCard`, `PendingOrdersCard`, `ActivityFeedCard`, `DataTable` (client-mode TanStack Table wrapper with loading/empty/error states).
- Deleted the 7 old template-demo components (`OverviewCards`, `PaymentsTable`, `SaleActivityChart`, `SprintProgress`, `SubscriptionsChart`, `TeamActivity`, `TeamMembersList`).
- `DashboardLayout`'s `<main>` now uses `bg-background` instead of the hardcoded `bg-slate-50/50`.
- `DashboardSidebar` no longer imports `useLogout` from the `auth` feature (was a feature-isolation violation) — logout now lives only in the navbar user menu via `useAuthStore.getState().clearAuth()` + `useNavigate`.
- Wrote `DashboardPage.test.tsx` test-first (8 cases covering welcome banner, stat cards, chart card + selector, pending orders, activity feed, tab labels, default tab's table headers), confirmed it failed for the right reason against the old template page, then implemented to green.

## Why
- `dashboard` was flagged in project scope as template/demo widgets that MUST be replaced with the real screen for the Dashboard → Financial → Transaction MVP sequence.
- The data layer (types/fixtures/service/hooks/utils) was already built and tested — this task only consumed it.

## Files touched
- `src/features/dashboard/layouts/DashboardLayout.tsx`
- `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/features/dashboard/components/DashboardNavbar.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/dashboard/components/{TrendPill,StatCard,PerformanceChartCard,PendingOrdersCard,ActivityFeedCard,DataTable}.tsx` (new)
- `src/features/dashboard/tests/DashboardPage.test.tsx` (new)
- Deleted: `src/features/dashboard/components/{OverviewCards,PaymentsTable,SaleActivityChart,SprintProgress,SubscriptionsChart,TeamActivity,TeamMembersList}.tsx`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed red against old template page), then implemented to green
- [x] `npm run test` passes (41/41 across the repo)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean for everything touched (only the pre-existing 10 `src/components/ui/*` errors remain, plus 1 unavoidable warning in `DataTable.tsx` from TanStack Table's React Compiler incompatibility — not an error)
- [ ] `/qa-audit` run (not run in this session)
- [x] Styled entirely with tokens (`bg-background`/`bg-card`/`bg-accent`/`bg-primary text-primary-foreground`/`text-muted-foreground`/`border-border`/`text-success`/`text-destructive`/`bg-chart-1`/`bg-chart-2`) — grepped clean of `slate-`/`zinc-`/`gray-`/`blue-`/hex in every touched file. Not manually screenshot-verified in both themes this session (token-only styling is the mechanism that guarantees theme correctness; defer visual double-check to `/qa-audit`).
- [ ] Reconciled against Figma frame (not done this session)

## Notes / follow-ups
- `/financial` and `/transactions` routes don't exist yet (only `/dashboard` is registered) — sidebar nav items for Financial/Transaction point at those hrefs via the `href`-based common `Link` (bypasses TanStack's strict route-literal typing, same pattern already used by `Link.tsx`) so they'll resolve once those features add their routes; do not need sidebar changes when that happens.
- The "This Week" select on the tabbed performance table is decorative only (approved scope decision) — not wired to any query param.
- `DataTable` is feature-local (`src/features/dashboard/components/`) and client-mode (no server pagination) — per explicit instruction, not promoted to `components/common` yet. If Transactions needs server-mode pagination, build that as a separate/evolved component rather than assuming this one covers it.
