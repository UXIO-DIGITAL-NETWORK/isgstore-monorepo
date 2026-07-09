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
- `dashboard` demo/template widgets not yet removed (PaymentsTable, SprintProgress, TeamActivity, …) — must be replaced by real UDN dashboard.
- Off-token palette classes leaking from copied shadcn/template code.
- `src/index.css` still blue-tinted (neutral retune + `--success` pending) — flag any component relying on a blue accent.
- `ThemeProvider defaultTheme` still `"system"` (should be `"dark"`); no `<Toaster />` mounted yet.
- Numbers missing `tabular-nums`; tables missing empty/error states; server data stashed in `useState`/Zustand.
- `src/models/` not yet migrated to `src/types/models/`.

## Tooling
- chrome-devtools MCP for screenshots/console/network where available. Write findings to `.artifacts/qa-log.md` (severity + concrete fix).
