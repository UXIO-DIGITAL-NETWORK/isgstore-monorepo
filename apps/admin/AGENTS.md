# AGENTS.md — ISG Store Admin Dashboard

Cross-tool overview for any coding agent. The **portable, agent-agnostic source of truth is `.agents/`**; Claude Code users also have the native `.claude/` layer and `CLAUDE.md`, which point back here. Keep all three in sync when conventions change.

## Project

Internal back-office SPA for the ISG Store multi-game top-up platform. Monochrome (shadcn `neutral`), Inter everywhere, light + dark (dark default). React 19 + Vite + TypeScript strict + Tailwind v4 (`@theme`, no config file) + shadcn/ui + TanStack Router/Query/Table + Zustand + RHF/Zod + Axios + recharts + sonner + next-themes. Testing: Vitest + React Testing Library, TDD-first.

## Read-first (precedence)

1. `.agents/context/system_architecture.md` (how — highest precedence)
2. `.agents/context/product_requirements.md` (what)
3. `.agents/context/design_system.md` (look)

## Project reality

- Backend is **separate and not built yet** -> **UI-first**: typed screens on mock fixtures behind a stable service interface; real-API swap is one file per service.
- **MVP = Dashboard -> Financial -> Transaction**; everything else is roadmap.
- Only `auth` is real; `dashboard` holds template widgets to replace. `src/index.css` is still blue-tinted (neutral retune pending — style by token _name_).
- Only role = `super-admin` (`["*"]`), but build the `<Can>`/`requirePermission` scaffold now. English-only.
- Every feature is built **TDD-first**: test cases → failing tests → implementation to green. No exceptions.

## Team & flow

- **@pm** (`.agents/roles/project_manager.md`) — reads context, writes `PLAN.md` (whole-scope), surfaces open decisions, **PAUSES for approval**.
- **@frontend** (`.agents/roles/frontend_developer.md`) — builds screens/components to the design system with custom primitives + shadcn, tokens only, wired to typed hooks, test-first.
- **@api** (`.agents/roles/api_integrator.md`) — owns entities, response envelopes, mock-backed services (swappable), TanStack Query hooks, uploads, polling — also test-first.
- **@qa** (`.agents/roles/quality_assurance.md`) — runs the Definition of Done, including the test suite; read-only on source; writes `.artifacts/qa-log.md`.

**Rhythm:** planning is whole-scope; execution is **one feature per approval gate**, built **test-first** (`.agents/rules/testing-strategy.md`). Never invent business rules — Finance settlement/fees are TBD; surface, don't guess.

## Rules (`.agents/rules/`)

`code-quality`, `feature-isolation`, `design-fidelity`, `rbac-security`, `commit-rules`, `workflow-discipline`, `memory-context`, `logging`, `accessibility`, `testing-strategy`.

## Skills (`.agents/skills/`)

Knowledge: `tanstack-router`, `tailwind-v4-shadcn`, `typescript-react-strict`, `api-service-layer`, `rbac-guards`, `build-data-table`, `charts-recharts`, `form-with-zod`, `testing-strategy`, `discover-tooling`. Process: `plan-feature`, `build-crud-feature`, `qa-audit`, `update-memory`, `log-change`, `add-shadcn`. Vendored design skill: `impeccable` (in `.claude/skills/`).

## MCP (`.mcp.json`)

`context7`, `shadcn`, `chrome-devtools`, `figma` (ISG Store Admin Dashboard file `l7izBcDr0PtS2FUdMdHFk3`).

## Artifact protocol (strict)

Agents create/write real files on disk (source + `PLAN.md` + a QA log + a `logs/` entry). Chat-only output = task failed. Content/scope comes only from `.agents/context/`.

## Claude Code specifics

`CLAUDE.md` (this repo's master brief), `.claude/agents/` (subagents), `.claude/agent-memory/` (per-agent `MEMORY.md`), `.claude/commands/` (`/plan-feature`, `/build-feature`, `/qa-audit`, `/add-shadcn`, `/commit`, `/typecheck`, `/log-change`, `/update-memory`), `.claude/rules/` (always-on mirrors), `.claude/output-styles/custom-components.md`, `.claude/hooks/format.sh`, `.claude/settings.json`.
