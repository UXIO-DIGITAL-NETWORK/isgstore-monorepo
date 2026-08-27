# 2026-08-27 — Performance chart reaches December

**Scope:** dashboard / performance chart
**Type:** fix
**Author/agent:** you

## What changed
- `MonthOption` now covers all twelve months, declared once as `MONTH_OPTIONS` in
  `dashboard.type.ts` and derived by both the service's month numbers and the selector's
  option list.
- The chart defaults to the **current** month rather than January.
- `chart-series.data.ts` is now typed on the three months it actually contains.

## Why
- The selector was frozen at January–March, a leftover from the fixture shape. The API
  has always validated `month` as 1..12 (`DashboardController::stats`), so April onward
  was simply unreachable for an admin.
- Deriving the labels, the option list and the API month numbers from one array means
  they cannot drift apart.
- The fixture is test-only and genuinely covers Q1; typing it on the full `MonthOption`
  union would have claimed a year it does not provide.

## Files touched
- `src/features/dashboard/{types/dashboard.type.ts,services/dashboard.service.ts,components/PerformanceChartCard.tsx,data/chart-series.data.ts}`
- `src/features/dashboard/tests/dashboard.service.test.ts`

## Verification
- [x] Built TDD-first (the December test failed first)
- [x] `npm run test` passes
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean

## Notes / follow-ups
- The dashboard's "This Week" select is still decorative — `GET /v1/dashboard/performance`
  accepts only `tab`, so wiring it needs a backend change first.
