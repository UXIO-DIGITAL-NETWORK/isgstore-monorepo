# Workflow: /build-feature <feature|screen> (Stage 2)

Owner: @frontend + @api. **One feature/screen at a time**, per `product_requirements.md §4` + `design_system.md`, built **TDD-first** (`system_architecture.md §4.11`), with a **stop-for-approval gate after every one** — the next does not start until the user signs off.

0. If the screen already exists, this is a **revision/replacement pass** — read the current code and its `logs/feature-changes/` entry first (e.g. the `dashboard` demo widgets are to be replaced, not extended).
1. **@api:** define/confirm the typed entities (`types/models`) + the feature service interface, backed by typed mock fixtures in `features/<f>/data/`; expose TanStack Query hooks. Write the service/hook tests first — assert the typed contract/shape and pagination param mapping — confirm they fail, then implement to green.
2. **Define the UI test cases** in plain language, grounded in the PRD spec for this screen: what must be reachable, what content/labels must exist, what interactions must work. Write those as failing tests (colocated `*.test.tsx`, using the `renderRoute` harness from `src/test/test-utils.tsx`) before any component code exists. Confirm they fail for the right reason (missing content/behavior), not a setup crash.
3. **@frontend:** build the accessible static + responsive layout with custom primitives + shadcn, tokens only, reusing the shared workhorses — implementing until the Part 2 tests go green. Wire the UI to the hooks; add loading/empty/error states; permission-gate privileged actions with `<Can>`; confirmation + toast for destructive actions.
4. Verify both light and dark; reconcile against the Figma frame (node IDs in `design_system.md §11`).
5. Run `/qa-audit` for this feature (includes `npm run test`); fix findings; commit `feat(<chapter>): ...` together with its `/log-change` entry (+ any memory update).
6. **STOP — present the feature and wait for user approval before the next feature.**

Never loosen or delete a test to make it pass — if a test turns out wrong against the spec, fix the test and say so.
