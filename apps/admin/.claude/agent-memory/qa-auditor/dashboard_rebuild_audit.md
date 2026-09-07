---
name: dashboard-rebuild-audit
description: Findings from the 2026-07-10 full dashboard-feature rebuild audit — what passed cleanly and what to re-check next time this feature or its shared chrome is touched
metadata:
  type: project
---

2026-07-10: audited the full `dashboard` feature rebuild (chrome + page + 6 components + typed mock data layer + `src/index.css` neutral retune + dev-only `/dashboard-preview` route). `tsc`/`lint`/`test` all re-verified clean; no cross-feature imports, no bare HTML, no raw hex/palette in scope, mocks properly behind `dashboard.service.ts`, `DataTable` has real loading/empty/error+retry states, tests are content/contract-real (not smoke-only). Full detail in `.artifacts/qa-log.md` from that date — this memory is the durable takeaway, not a re-statement of the log.

**Why:** two things worth carrying into every future audit of this feature or its neighbors (`financial`, `transactions`).

**How to apply:**
1. **`DashboardLayout` (`src/features/dashboard/layouts/DashboardLayout.tsx`) is app-wide chrome, not dashboard-page-specific** — `src/routes/_protected.tsx` uses it as the shell for *every* protected route via a deep import (`@/features/dashboard/layouts/DashboardLayout`, bypassing the feature's `index.ts` barrel, which only exports `DashboardPage`). When `financial`/`transactions` land, check whether this got promoted to `src/components/layouts/` (correct fix, per `system_architecture.md`'s "Global layout wrappers" reservation for that dir) or is still a deep cross-route dependency on the `dashboard` feature — flag if still unresolved.
2. **Log-entry completeness check:** this rebuild had two agent-authored logs (`2026-07-10-dashboard-data-layer.md`, `2026-07-10-dashboard-ui-rebuild.md`) but the `src/index.css` neutral retune, the `/dashboard-preview` route, and two post-hoc bugfixes (revenue-column formatting, activity-log stale timestamp) had *no* log entry at all. When auditing any multi-session/multi-agent feature, always diff `git status`/`git diff --stat` against what the existing logs claim to cover — don't assume the logs are exhaustive just because they exist and read well.
3. Confirmed-good patterns worth reusing as the reference bar for `financial`/`transactions`: mocks-behind-service (`services/*.service.ts` is the only fixture importer), `DataTable` generic loading/empty/error(+retry) shape, `sr-only` icon-button labels mirroring `ThemeToggle`, shadcn `CommandDialog` for the command palette (real focus trap, not hand-rolled).

Related: [[recurring-findings]] (general grep-based recurring issues), the project still has `ThemeProvider defaultTheme="system"` (should be `"dark"`) and no `<Toaster />` mounted in `src/main.tsx` — unresolved, doesn't block dashboard (read-only, no toasts) but will block the first mutating feature.
