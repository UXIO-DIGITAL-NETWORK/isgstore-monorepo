# QA Auditor — Project Memory

> Read this before every audit; re-check the recurring findings each time. Read-only on source — report, don't rewrite.

## Definition of Done (source: system_architecture.md §9)
Per feature (before its gate) and once globally: `tsc --noEmit` + `lint` clean, no `any`, no cross-feature imports, no raw hex / off-token palette classes, no bare HTML tags in feature TSX, `tabular-nums` on numbers, both light+dark render, Figma reconciled, server-side tables with loading/empty/error states, mocks behind the service boundary, `<Can>` on privileged actions + guards in `beforeLoad`, keyboard/focus/labels/overlay containment, `logs/feature-changes/` entry present.

## Grep checks
- Tests: `npm run test` must be clean; spot-check the audited feature has colocated `*.test.tsx` covering reachability/content (pages), contract shape (services/hooks), and validation behavior (forms) — not just a trivial "renders" smoke test.
- Cross-feature: `grep -rn 'from "@/features/' src/features`
- Raw hex: `grep -rnE '#[0-9a-fA-F]{3,6}\b' src/components src/features`; palette classes: `grep -rnE '\b(slate|zinc|gray|neutral)-[0-9]' src/features src/components`
- Bare HTML in features: `grep -rnE '<(div|p|span|h[1-6]|img|a)[ >]' src/features`

## Likely recurring findings (this project)
- `dashboard` template widgets (PaymentsTable, SprintProgress, TeamActivity, …) — **RESOLVED 2026-07-10**, real UDN dashboard now in place (see [dashboard rebuild audit](dashboard_rebuild_audit.md)). Re-check if `dashboard` is touched again that this doesn't regress.
- `src/index.css` blue-tinted — **RESOLVED 2026-07-10**, true-neutral retune + `--success`/`--success-foreground` landed (still unstaged as of that date — confirm it's actually committed on next audit).
- Off-token palette classes still present but **out of scope / pre-existing**: `src/components/layouts/RootLayout.tsx` (`bg-slate-50`), `src/features/auth/**` (multiple `slate-`/`neutral-`/raw shadow), `src/components/common/Image.tsx` (`bg-gray-200`) — not introduced by dashboard work, still need a cleanup pass.
- `ThemeProvider defaultTheme` still `"system"` (should be `"dark"`); no `<Toaster />` mounted yet — still open as of 2026-07-10, doesn't block read-only screens but will block the first mutating feature (Financial/Transactions destructive actions need toasts).
- Numbers missing `tabular-nums`; tables missing empty/error states; server data stashed in `useState`/Zustand — dashboard itself is clean on this axis now (see rebuild audit); keep checking new features.
- `src/models/` not yet migrated to `src/types/models/` — status unverified since last check, re-confirm.
- `DashboardLayout` is app-wide chrome living under `features/dashboard/layouts/`, imported by deep path (not through the feature barrel) from `_protected.tsx`/`_preview.tsx` — watch whether this gets promoted to `components/layouts/` before `financial`/`transactions` add routes (see [dashboard rebuild audit](dashboard_rebuild_audit.md)).

## Tooling
- chrome-devtools MCP for screenshots/console/network where available. Write findings to `.artifacts/qa-log.md` (severity + concrete fix).

## Detailed audit notes
- [Dashboard rebuild audit — 2026-07-10](dashboard_rebuild_audit.md) — full-feature rebuild findings: app-wide-chrome-in-a-feature issue, log-entry completeness gap, confirmed-good reusable patterns (DataTable states, sr-only icon labels, shadcn CommandDialog).
