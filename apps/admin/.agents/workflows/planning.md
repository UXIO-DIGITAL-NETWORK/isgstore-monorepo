# Workflow: /plan-feature (Stage 1)

Owner: @pm. **No implementation code in this stage.** Planning is **whole-scope** — one `PLAN.md` covers all MVP screens; execution (Stage 2) then runs one feature at a time with its own approval gate (`feature.md`).

1. Read all `context/` docs + root `CLAUDE.md`, plus the as-built state: only `auth` is real; `dashboard` holds demo widgets to replace; `src/index.css` is still blue-tinted (retune pending, `design_system.md §3.1`).
2. Draft `PLAN.md` at the repo root:
   - file/component tree (`system_architecture.md §3`);
   - MVP build order **Dashboard → Financial → Transaction**, listing the shared primitives to build first (`StatCard`, `TrendPill`, `PerformanceChartCard`, server-side `DataTable`);
   - the true dependency delta (most is installed) and setup tasks (neutral retune + `--success`, `models` → `types/models`, `QueryClient` → `lib/react-query.ts`, `defaultTheme="dark"`, mount `<Toaster />`, first-time Vitest + React Testing Library harness per `system_architecture.md §4.11` if not already set up);
   - a data map: PRD screens → typed view-models / mock fixtures (`features/<f>/data/*`) typed against `src/types/models/*`.
   - a note that every feature in Stage 2 is built **TDD-first** (`feature.md`) — this is standing policy, not a per-feature decision to re-litigate.
3. List the open decisions with a recommended default each: Finance business scope (TBD — do not invent), provisional entity fields, and the setup tasks above.
4. **STOP.** Output `PLAN.md` + the decision questions and wait for explicit approval.
