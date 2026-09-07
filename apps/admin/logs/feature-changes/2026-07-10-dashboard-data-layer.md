# 2026-07-10 — Dashboard typed mock data layer

**Scope:** dashboard (data layer only — types, fixtures, service, hooks; no UI)
**Type:** feat
**Author/agent:** @api

## What changed
- Added `src/features/dashboard/types/dashboard.type.ts`: `Operator`, `TrendDirection`, `StatCardData`, `ChartPoint`, `MonthOption`, `PendingOrders`, `ActivityLog`, `PerformanceRow`, `PerformanceTabKey`.
- Added typed fixtures under `src/features/dashboard/data/`: `operator.data.ts` (`OPERATOR`), `stat-cards.data.ts` (`STAT_CARDS`), `chart-series.data.ts` (`CHART_SERIES`, keyed by `january`/`february`/`march`), `pending-orders.data.ts` (`PENDING_ORDERS`), `activity-log.data.ts` (`ACTIVITY_LOG`), `performance-rows.data.ts` (`PERFORMANCE_ROWS`, keyed by `category`/`product`/`user`).
- Added `src/features/dashboard/services/dashboard.service.ts` (`dashboardService`) — mock-backed today, one-line comment marks the mock->real `api.get(...)` swap seam per `system_architecture.md §6`.
- Added `src/features/dashboard/hooks/useDashboard.ts` — `useOperator`, `useStatCards`, `useChartSeries(month)`, `usePendingOrders`, `useActivityLog`, `usePerformanceRows(tab)`, all `useQuery` (read-only, no mutations).
- Added shared (non-feature-scoped) utils: `src/utils/currency.ts` (`formatCurrency`) and `src/utils/date.ts` (`formatRelativeTime`, `formatBannerDate`) — promoted up since multiple future features need currency/date formatting.
- Colocated tests (all written first, confirmed red, then implemented to green): `src/utils/currency.test.ts`, `src/utils/date.test.ts`, `src/features/dashboard/tests/dashboard.data.test.ts`, `src/features/dashboard/tests/dashboard.service.test.ts`, `src/features/dashboard/tests/useDashboard.test.tsx`.

## Why
- Dashboard currently has zero data layer (every number inline in JSX). This is the typed mock-service seam the frontend pass consumes next — service methods return fixtures directly today, swap to `api.*` later with hooks/UI untouched.
- Stat-card, pending-orders, and category-performance figures are exact reference values (deliberate exception to "invent realistic data" — fidelity to the design reference is the point); product/user performance rows and chart-series numbers are plausible invented data since no reference exists for them.
- `formatCurrency`/`formatRelativeTime`/`formatBannerDate` went to `src/utils/` (not `features/dashboard/`) since they're generic, reusable formatting helpers per `design_system.md`.
- Activity log fixture stores raw ISO `timestamp`s only — relative-time strings ("5m Ago") are computed at render time by the UI layer via `formatRelativeTime`, never baked into fixtures.

## Files touched
- `src/features/dashboard/types/dashboard.type.ts`
- `src/features/dashboard/data/operator.data.ts`
- `src/features/dashboard/data/stat-cards.data.ts`
- `src/features/dashboard/data/chart-series.data.ts`
- `src/features/dashboard/data/pending-orders.data.ts`
- `src/features/dashboard/data/activity-log.data.ts`
- `src/features/dashboard/data/performance-rows.data.ts`
- `src/features/dashboard/services/dashboard.service.ts`
- `src/features/dashboard/hooks/useDashboard.ts`
- `src/utils/currency.ts`
- `src/utils/date.ts`
- `src/features/dashboard/tests/dashboard.data.test.ts`
- `src/features/dashboard/tests/dashboard.service.test.ts`
- `src/features/dashboard/tests/useDashboard.test.tsx`
- `src/utils/currency.test.ts`
- `src/utils/date.test.ts`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed red — missing-module errors), then implemented to green
- [x] `npm run test` passes (33/33, including pre-existing auth/home suites)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (only 10 pre-existing errors in `src/components/ui/*` shadcn output, confirmed via `git stash` to predate this change)
- [ ] `/qa-audit` run — N/A, no UI in this pass
- [ ] Renders in both light and dark — N/A, no UI in this pass
- [ ] Reconciled against Figma frame — N/A, no UI in this pass

## Notes / follow-ups
- No UI components built (`StatCard`, `PerformanceChartCard`, etc.) — that's the next, separate frontend pass; it wires to the hooks/utils exported here.
- `dashboardService.getChartSeries(month)` throws for an unknown `MonthOption` (tested) rather than returning `undefined` — pick this contract up if extending to more months.
- `formatCurrency` normalizes `Intl.NumberFormat("id-ID", ...)`'s non-breaking space (U+00A0) to a regular space for deterministic string equality — worth knowing if a future locale/currency formatter is added elsewhere.
