---
description: Stage 2 — build ONE feature/screen end-to-end, TDD-first (tests before implementation), QA it, then stop for approval.
argument-hint: <feature> (dashboard | financial | transactions)
---
Confirm the current state:

!`git status --short`

Build the feature "$ARGUMENTS" following `.agents/workflows/feature.md` — **test-first at every layer** (`.agents/rules/testing-strategy.md`), one feature at a time:

1. **@api** (`.agents/agents.md`): write a failing test asserting the service/hook's typed contract first (mock fixture matches the type; list params map correctly), confirm it fails for the right reason, then implement — typed entities (`src/types/models`), a feature service interface backed by typed mock fixtures in `features/$ARGUMENTS/data/`, TanStack Query hooks.
2. Define the UI test cases in plain language against the PRD spec for this screen (what must be reachable, what content/labels must exist, what interactions must work), write them as failing tests (colocated `*.test.tsx`, using `renderRoute` from `src/test/test-utils.tsx` — set the harness up first if it doesn't exist yet), confirm they fail for the right reason.
3. **@frontend**: build accessible static + responsive layout with custom primitives + shadcn, **tokens only**, reusing the shared workhorses, implementing until step 2's tests go green; wire to hooks; add loading/empty/error states; `<Can>`-gate privileged actions; confirm + toast for destructive.
4. Verify **both light and dark**; reconcile against the Figma frame (node IDs in `design_system.md §11`).
5. Run `/qa-audit` for this feature (includes `npm run test`); fix findings; then `/commit` with a `/log-change` entry (+ memory update).

Respect feature isolation, TS strict (no `any`), and the registry-only routing (`requirePermission` in `beforeLoad`). Never loosen or delete a test to make it pass — if a test is wrong against the spec, fix the test and say so.
**STOP — present the feature and wait for approval before the next.**
