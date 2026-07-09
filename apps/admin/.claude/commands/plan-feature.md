---
description: Whole-scope Stage 1 planning — read context docs, write PLAN.md, surface open decisions, then STOP for approval.
argument-hint: [optional focus, e.g. dashboard]
---
Read the authoritative context first:

@.agents/context/system_architecture.md
@.agents/context/product_requirements.md
@.agents/context/design_system.md

As **@pm** (`.agents/roles/project_manager.md`), follow `.agents/workflows/planning.md` and write `PLAN.md` at the repo root:
- file/component tree (`system_architecture.md §3`);
- MVP build order **Dashboard -> Financial -> Transaction** (use "$ARGUMENTS" to bias emphasis if given), shared primitives first (`StatCard`/`TrendPill`/`PerformanceChartCard`/`DataTable`);
- the true dependency + setup delta (neutral retune + `--success`, `src/models` -> `src/types/models`, `QueryClient` -> `src/lib/react-query.ts`, `defaultTheme="dark"`, mount `<Toaster />`);
- a PRD-screen -> mock-fixtures (`features/<f>/data/*`) data map typed against `src/types/models/*`.
List open decisions with a recommended default (Finance business scope is TBD — do NOT invent; provisional entity fields).
**STOP after PLAN.md. No implementation code. Wait for explicit approval.**
