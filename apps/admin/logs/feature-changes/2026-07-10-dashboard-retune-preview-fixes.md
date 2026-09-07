# 2026-07-10 — Neutral retune, dev-only preview route, and post-review fidelity fixes

**Scope:** dashboard (+ global `src/index.css`)
**Type:** feat / fix
**Author/agent:** orchestrator (main session), reviewing the work of @api and @frontend

## What changed

### Neutral retune (blocking prerequisite, done first)
- `src/index.css`: replaced the blue-tinted `:root`/`.dark` token blocks with the true-neutral grayscale block from `design_system.md §3.1`, added `--success`/`--success-foreground` tokens, and registered `--color-success`/`--color-success-foreground` in the existing `@theme inline` block. Font/shadow/tracking/spacing scales were left untouched (not part of the retune). Verified visually in both themes via chrome-devtools against the reference — see below.

### Dev-only `/dashboard-preview` route
- `src/routes/_preview.tsx` — new pathless layout route, `component: DashboardLayout` (same layout the real `/dashboard` route uses). `beforeLoad` deliberately has **no** `requireAuth` (this is the unauthenticated design-preview seam for viewing screens before the real API/auth exists) — instead it throws `notFound()` when `import.meta.env.PROD` is true, so the route is inert in a production build. Comment in the file explains the omission.
- `src/routes/_preview/dashboard-preview/index.tsx` — child route, `component: DashboardPage` (same `DashboardPage` import as the real `/_protected/dashboard/index.tsx` route) → resolves `/dashboard-preview`.
- Regenerated `src/routeTree.gen.ts` via `npm run build` (never hand-edited).
- Verified via chrome-devtools: `npm run preview` (production build, `PROD=true`) → `/dashboard-preview` renders a blank page (blocked, no console errors) while `/dashboard` still redirects an unauthenticated session to `/login`. `npm run dev` (`PROD=false`) → `/dashboard-preview` renders the full dashboard correctly in both light and dark.

### Post-review fidelity fixes (found during my own verification pass, not by either building agent)
1. **Revenue column wrongly currency-formatted** — `DashboardPage.tsx`'s tabbed table applied `formatCurrency()` to the "Revenue" column, producing `Rp 32,00` instead of the reference's plain count `32`. The reference image's Category/Product/User Performance tables show small plain integers, not money. Fixed to render the raw number; removed the now-unused `formatCurrency` import from `DashboardPage.tsx`.
2. **Stale activity-feed timestamps** — `data/activity-log.data.ts` originally anchored its fixed ISO timestamps to `2026-05-24` (matching the reference mockup's fake date), so on any other day the feed showed nonsensical values like "46d Ago"/"47d Ago" instead of the intended 5m/10m/45m/3h/1d density. Rewrote the fixture to compute timestamps as offsets from `Date.now()` at module load, so the feed always shows realistic small offsets regardless of when the app actually runs.
3. **Missing retry affordance on 3 error states** (QA finding L-1) — `PendingOrdersCard`, `ActivityFeedCard`, and `PerformanceChartCard` showed an error message with no way to recover short of a full page reload, unlike `DataTable` which already had a retry button. Added a `refetch()`-wired "Retry" `Button` to all three, matching the existing `DataTable` pattern.

## Why
- The neutral retune was blocking accurate visual comparison against the pure-monochrome reference and had been deferred three times previously per the task brief.
- The preview route lets the dashboard be viewed end-to-end before the real backend/auth flow exists, without weakening the real `/dashboard` route's `requireAuth` guard.
- The three fixes above surfaced during my own trust-but-verify pass (reading the built files and driving the app with chrome-devtools) after both subagents reported green — none were caught by the existing test suite, since it doesn't assert exact rendered values for these paths.

## Files touched
- `src/index.css`
- `src/routes/_preview.tsx` (new)
- `src/routes/_preview/dashboard-preview/index.tsx` (new)
- `src/routeTree.gen.ts` (regenerated)
- `src/features/dashboard/pages/DashboardPage.tsx` (revenue-column fix)
- `src/features/dashboard/data/activity-log.data.ts` (dynamic timestamp fix)
- `src/features/dashboard/components/{PendingOrdersCard,ActivityFeedCard,PerformanceChartCard}.tsx` (retry states)

## Verification
- [x] `npx tsc --noEmit` clean
- [x] `npm run test` passes (41/41)
- [x] `npm run lint` — only the pre-existing 10 `src/components/ui/*` errors remain (unchanged baseline) + 1 documented `DataTable.tsx` warning
- [x] Grepped `src/features/dashboard/`, `src/utils/`, `src/routes/_preview*` clean of `slate-`/`zinc-`/`gray-`/`blue-`/raw hex
- [x] Both light and dark themes visually verified via chrome-devtools screenshots against the reference image (welcome banner live date, stat card figures, pending orders counts, category performance table rows, chart area rendering all match)
- [x] `/dashboard-preview` confirmed dev-only (resolves in dev, `notFound()` in a prod build); `/dashboard` confirmed still gated by `requireAuth`
- [x] `/qa-audit` run — no blocking findings; full report in `.artifacts/qa-log.md`

## Known limitations / follow-ups
- **Figma MCP access denied** for file `l7izBcDr0PtS2FUdMdHFk3` (no edit access on this account) — both `get_design_context` and `get_screenshot` calls failed. The build worked from the flat reference image plus `product_requirements.md §4.1` and `design_system.md §8/§11` instead of a live Figma pull. Node `22011-2008` reconciliation should be redone if/when Figma access is granted.
- **QA finding M-2 (not actioned, flagged for later):** `DashboardLayout` is app-wide chrome — it's the `component` for `_protected.tsx` (every protected route) and now also `_preview.tsx` — but it physically lives under `features/dashboard/layouts/` and both routes import it via a deep path that bypasses the feature's `index.ts` barrel. This predates this task and was explicitly out of scope (the brief said to keep `DashboardLayout`'s structure as-is, only fixing the background class). Recommend promoting it to `src/components/layouts/` before `financial`/`transactions` land and also depend on it — not done here to avoid an unrequested refactor beyond the approved plan.
