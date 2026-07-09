---
description: Stage 2 — build ONE feature/screen end-to-end (data layer + UI), QA it, then stop for approval.
argument-hint: <feature> (dashboard | financial | transactions)
---
Confirm the current state:

!`git status --short`

Build the feature "$ARGUMENTS" following `.agents/workflows/feature.md` (one feature at a time):
1. **@api** (`.agents/agents.md`): confirm typed entities (`src/types/models`) + a feature service interface backed by typed mock fixtures in `features/$ARGUMENTS/data/`; expose TanStack Query hooks.
2. **@frontend**: build accessible static + responsive layout with custom primitives + shadcn, **tokens only**, reusing the shared workhorses; wire to hooks; add loading/empty/error states; `<Can>`-gate privileged actions; confirm + toast for destructive.
3. Verify **both light and dark**; reconcile against the Figma frame (node IDs in `design_system.md §11`).
4. Run `/qa-audit` for this feature; fix findings; then `/commit` with a `/log-change` entry (+ memory update).
Respect feature isolation, TS strict (no `any`), and the registry-only routing (`requirePermission` in `beforeLoad`).
**STOP — present the feature and wait for approval before the next.**
