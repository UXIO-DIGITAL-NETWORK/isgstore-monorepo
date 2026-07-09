# 🤖 Autonomous Admin Team — UDN Admin Dashboard

This workspace builds the **UDN Admin Dashboard** — a monochrome (shadcn `neutral`) back-office SPA on **React 19 + Vite + TanStack Router/Query/Table + Tailwind v4 + shadcn/ui + Zustand + RHF/Zod + Axios**, following the Feature-Based Architecture and standards in `context/`.

> This `.agents/` folder is the **portable, agent-agnostic spec** (works with Claude Code or any agent). Claude Code also reads the native `.claude/` folder and the root `CLAUDE.md`, which point back here.

## Read-First Rule (CRITICAL)
Before any task, every agent MUST read: `context/system_architecture.md` (structure — highest precedence), `context/product_requirements.md` (content/scope), `context/design_system.md` (look), and the root `CLAUDE.md`.

## Project reality (read before planning)
- **Backend is separate and NOT built yet → UI-first.** Build typed screens backed by mock fixtures behind a stable service interface; the real-API swap is a one-file change per service (`system_architecture.md §6`).
- **MVP = Dashboard, Financial, Transaction** (build in that order). Everything else is roadmap (`product_requirements.md §5`).
- **Only `auth` is a real feature.** `dashboard` still holds template/demo widgets that MUST be replaced.
- **Theme is monochrome neutral**, but the shipped `src/index.css` is still blue-tinted — retune per `design_system.md §3.1`. Style by token *name*.
- **Only role = `super-admin`** (all permissions), but build the `<Can>`/`requirePermission` scaffold now.

## Team Roster & Execution Flow
### @pm — Project Manager / Lead Architect (`roles/project_manager.md`)
Reads the brief + `context/`, writes `PLAN.md`, surfaces open decisions. **MUST PAUSE for explicit user approval** before implementation.
### @frontend — Frontend Engineer (`roles/frontend_developer.md`)
Builds screens/components to the design system with custom primitives + shadcn, tokens only, wired to typed hooks.
### @api — API Integrator (`roles/api_integrator.md`)
Owns entities, response envelopes, feature services (mock-backed now, swappable later), TanStack Query hooks, uploads, polling.
### @qa — Quality Assurance (`roles/quality_assurance.md`)
Audits type-safety, feature isolation, design fidelity, authorization, and a11y. Writes `.artifacts/qa-log.md`. Read-only on source.

## System Commands (map to `.claude/skills/` + `.claude/commands/`)
- `/plan-feature` ➔ @pm → produces `PLAN.md` (whole-scope), then PAUSES (`workflows/planning.md`).
- `/build-feature <feature>` ➔ @frontend + @api build one feature, then **stop for approval** before the next (`workflows/feature.md`).
- `/qa-audit` ➔ @qa runs the Definition of Done (`system_architecture.md §9`), per feature + globally (`workflows/qa.md`).
- `/add-shadcn <component>`, `/log-change`, `/update-memory`, `/commit`, `/typecheck` — see `.claude/commands/`.

## Skills (`.agents/skills/`) — activate by task
**Knowledge (conventions; enforcement mirrors in `.claude/rules/`):** `tanstack-router`, `tailwind-v4-shadcn`, `typescript-react-strict`, `api-service-layer`, `rbac-guards`, `build-data-table`, `charts-recharts`, `form-with-zod`, `discover-tooling`.
**Process (mirrors of the invokable `.claude/skills/` slash-commands):** `plan-feature`, `build-crud-feature`, `qa-audit`, `update-memory`, `log-change`, `add-shadcn`.
**Vendored design skill:** `impeccable` (v3.9.1) lives in `.claude/skills/impeccable/` — invoke `/impeccable <craft|polish|audit|…>` (run `/impeccable init` first use) for production-grade UI craft on dashboards/forms/app-shells.

## Rules (`.agents/rules/`) — always on
`code-quality`, `feature-isolation`, `design-fidelity`, `rbac-security`, `commit-rules`, `workflow-discipline`, `memory-context`, `logging`, `accessibility`.

## MCP (`.mcp.json`)
`context7` (live TanStack/Tailwind v4/shadcn/Zod docs), `shadcn` (browse/install primitives — pairs with `/add-shadcn`), `chrome-devtools` (QA screenshots/console/perf), `figma` (pull frames/tokens from the UDN Admin Dashboard file — see `design_system.md`).

## Artifact Generation Protocol (STRICT)
Agents MUST create/write real files on disk (source + `PLAN.md` + a QA log + a `logs/` entry). Chat-only output = task FAILED. Content/scope comes ONLY from `context/`; never invent business rules — surface TBDs as open decisions.
