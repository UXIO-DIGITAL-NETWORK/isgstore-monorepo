# Workflow: /build-feature <feature|screen> (Stage 2)

Owner: @frontend + @api. **One feature/screen at a time**, per `product_requirements.md §4` + `design_system.md`, with a **stop-for-approval gate after every one** — the next does not start until the user signs off.

0. If the screen already exists (e.g. `dashboard`), this is a **revision/replacement pass** — read the current code and its `logs/feature-changes/` entry first (the `dashboard` demo widgets are to be replaced, not extended).
1. **@api:** define/confirm the typed entities (`types/models`) + the feature service interface, backed by typed mock fixtures in `features/<f>/data/`; expose TanStack Query hooks.
2. **@frontend:** build the accessible static + responsive layout with custom primitives + shadcn, tokens only. Reuse the shared workhorses (`StatCard`/`TrendPill`/`PerformanceChartCard`/`DataTable`) — build them generically the first time, then reuse.
3. Wire the UI to the hooks; add loading (skeleton) / empty / error states; permission-gate privileged actions with `<Can>`; confirmation + toast for destructive actions.
4. Verify both light and dark; reconcile against the Figma frame (node IDs in `design_system.md §11`).
5. Run `/qa-audit` for this feature; fix findings; commit `feat(<scope>): …` together with its `/log-change` entry (+ any memory update).
6. **STOP — present the feature and wait for user approval before the next.**
