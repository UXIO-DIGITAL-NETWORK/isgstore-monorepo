# 2026-08-08 — Reports hub + Membership module

**Scope:** new features `reports`, `membership`
**Type:** feat
**Author/agent:** you

## What changed
- **Reports** (`src/features/reports/`, route `/admin/reports`, `requirePermission("reports.view")`): consolidated Total Revenue / Transactions / Net Profit stat cards + per-product/channel breakdown table, daily/monthly tabs. `reportsService.getSummary(period)` → `/v1/reports/summary`.
- **Membership** (`src/features/membership/`, route `/admin/memberships`, `requirePermission("memberships.view")`): loyalty-tier list (name, min spend, discount, status) + gated delete. `membershipService.list/remove` → `/v1/membership-tiers`.
- Sidebar: enabled the previously-disabled "Reports" and "Membership" nav items to point at the new routes.

## Why
- Both were roadmap gaps (PRD §5) with no feature folder. Reports reuses shared `StatCard`/`Table`; Membership is a first slice (list + delete) since the loyalty rules are still TBD — add/edit forms follow.

## Files touched
- `src/features/reports/**`, `src/features/membership/**`
- `src/routes/admin/_protected/{reports,memberships}/index.tsx` (+ regenerated `routeTree.gen.ts`)
- `src/features/dashboard/components/DashboardSidebar.tsx`
- tests: `ReportsPage.test.tsx`, `MembershipListPage.test.tsx`

## Verification
- [x] TDD-first; full suite green (71 files, 418 tests); `tsc -b` clean; lint 0 errors
- [ ] Manual light/dark pass

## Notes / follow-ups
- `/v1/reports/summary` and `/v1/membership-tiers` assumed on the contract — confirm with backend.
- Membership add/edit form + tier assignment deferred pending confirmed loyalty scope (PRD §5 "scope TBD").
