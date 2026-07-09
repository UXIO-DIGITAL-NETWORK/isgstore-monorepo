# Workflow: /qa-audit

Owner: @qa. Run per feature — **before that feature's approval gate** (`feature.md` step 5) — and once globally at the end.

1. `npx tsc --noEmit` + `npm run lint` clean; no `any`.
2. `npm run test` clean — every case passes. Spot-check that meaningful tests exist for the audited feature (colocated `*.test.tsx`; reachability + content for pages, contract tests for services/hooks, validation tests for forms) and that they were written test-first, not bolted on after (`system_architecture.md §4.11`).
3. `grep -r "from '@/features/" src/features` → no cross-feature imports.
4. `grep -rE "#[0-9a-fA-F]{6}"` (and `slate-`/`zinc-`/`gray-` palette classes) in `src/components src/features` → no raw hex, tokens only.
5. `grep -rnE "<(div|p|span|h[1-6]|img|a)[ >]" src/features` → no bare HTML tags (custom primitives only).
6. Design: numbers use `tabular-nums`; screens render in **both** light and dark; reconcile against Figma.
7. Data layer: server-side tables have loading/empty/error states; mocks behind the service boundary; no server data in Zustand/`useState`.
8. Authz: privileged actions wrapped in `<Can>`; guards in `beforeLoad`; destructive actions have confirmation + toast.
9. A11y: keyboard nav, visible focus, labelled controls, icon-button `sr-only` labels, overlay focus containment.
10. A `logs/feature-changes/` entry exists for the audited work.
11. Write results to `.artifacts/qa-log.md`.

Runtime note: use the chrome-devtools MCP for screenshots/console/network where available. Recurring past findings live in `.claude/agent-memory/qa-auditor/MEMORY.md` — re-check them every audit.
