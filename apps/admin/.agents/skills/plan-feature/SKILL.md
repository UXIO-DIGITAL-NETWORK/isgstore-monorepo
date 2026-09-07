---
name: plan-feature
description: Stage 1 whole-scope planning — read context docs, write PLAN.md, surface open decisions, then STOP for approval. Portable mirror of the invokable .claude/skills/plan-feature.
---
# Plan the Feature (portable)
Produces the single whole-scope plan before any code. Read `context/{system_architecture,product_requirements,design_system}.md` + root `CLAUDE.md`. Write `PLAN.md` at the repo root: file/component tree (`system_architecture.md §3`), MVP order **Dashboard -> Financial -> Transaction** with shared primitives first (`StatCard`/`TrendPill`/`PerformanceChartCard`/`DataTable`), the true dependency + setup delta (neutral retune + `--success`, `models`->`types/models`, `QueryClient`->`lib/react-query.ts`, `defaultTheme="dark"`, mount `<Toaster />`), and a PRD->mock-fixtures data map. List open decisions (Finance scope is TBD — do not invent; provisional entity fields) with recommended defaults.
**Hard rule:** planning is whole-scope, execution is per-feature (`workflows/feature.md`). **STOP after PLAN.md** and wait for explicit approval; no implementation code in this stage. (Claude Code: `/plan-feature`.)
