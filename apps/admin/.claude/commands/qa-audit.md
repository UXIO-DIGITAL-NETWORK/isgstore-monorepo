---
description: Run the Definition of Done for a feature (or globally), including the test suite, and write findings to .artifacts/qa-log.md.
argument-hint: [feature name, or "global"]
---
Run the static gates and summarize (file + line + concrete fix):

!`npx tsc --noEmit`
!`npm run lint`
!`npm run test`
!`grep -rn 'from "@/features/' src/features || echo "OK: no cross-feature imports"`
!`grep -rnE '#[0-9a-fA-F]{3,6}\b' src/components src/features || echo "OK: no raw hex"`
!`grep -rnE '<(div|p|span|h[1-6]|img|a)[ >]' src/features || echo "OK: no bare HTML tags in features"`

As **@qa** (`.agents/workflows/qa.md`), then check for "$ARGUMENTS": tests were actually written test-first and meaningfully cover the feature (colocated `*.test.tsx` — reachability + content for pages, contract shape for services/hooks, validation behavior for forms; flag suites that only assert "renders without crashing" as insufficient); `tabular-nums` on numbers; both light+dark render; Figma reconciled; server-side tables have loading/empty/error states; mocks behind the service boundary (not in components); no server data in Zustand/`useState`; `<Can>` on privileged actions + guards in `beforeLoad`; keyboard/focus/labels/overlay containment; a `logs/feature-changes/` entry exists. Use the chrome-devtools MCP for browser checks if available. Write severity + concrete fix per issue to `.artifacts/qa-log.md`. **Read-only on source — report, don't rewrite.**
