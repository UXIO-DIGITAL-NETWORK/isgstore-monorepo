# Workflow: /qa-audit

Owner: @qa. Run per feature — **before that feature's approval gate** (`feature.md` step 5) — and once globally at the end.

1. `npx tsc --noEmit` + `npm run lint` clean; no `any`.
2. `grep -rn "from \"@/features/" src/features` → no cross-feature imports.
3. `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/components src/features` → no raw hex (tokens only). Also flag `slate-`/`zinc-`/`gray-` palette classes.
4. `grep -rnE "<(div|p|span|h[1-6]|img|a)[ >]" src/features` → no bare HTML tags in feature TSX (custom primitives only).
5. Design: numbers use `tabular-nums`; screens render in **both** light and dark (toggle theme); reconcile against Figma (`l7izBcDr0PtS2FUdMdHFk3`).
6. Data layer: server-side tables have loading/empty/error states; mocks are behind the service boundary (not inline in components); no server data in Zustand/`useState`.
7. Authz: privileged actions wrapped in `<Can>`; guards in `beforeLoad`; destructive actions have confirmation + toast.
8. A11y: keyboard nav, visible focus ring, labelled controls, icon-button `sr-only` labels, overlay focus containment.
9. A `logs/feature-changes/` entry exists for the audited work.
10. Write results to `.artifacts/qa-log.md` (severity + concrete fix per issue).

Runtime note: use the chrome-devtools MCP for screenshots/console/network where available. Recurring past findings live in `.claude/agent-memory/qa-auditor/MEMORY.md` — re-check them every audit.
