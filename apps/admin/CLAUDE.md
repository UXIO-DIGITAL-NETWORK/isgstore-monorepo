# CLAUDE.md — UDN Admin Dashboard

Master brief for Claude Code in this repo. It points at the deeper specs; it does **not** duplicate them.

## What this is

An internal back-office SPA to manage the UDN multi-game top-up platform. **Monochrome** (shadcn `neutral`), **Inter** everywhere, **light + dark (dark default)**. Stack: **React 19 + Vite + TypeScript (strict) + Tailwind v4 (`@theme`, no config file) + shadcn/ui (`new-york`) + TanStack Router/Query/Table + Zustand + React Hook Form + Zod + Axios + recharts + sonner + next-themes**.

## Authoritative documents (read before any task)

Precedence when they conflict:

1. `.agents/context/system_architecture.md` — **how** we build (highest precedence)
2. `.agents/context/product_requirements.md` — **what** we build (scope/content)
3. `.agents/context/design_system.md` — the **look** (tokens, components)
4. this `CLAUDE.md` — operating rules that tie it together

## Project reality (important)

- **Backend is separate and NOT built yet -> UI-first.** Build typed screens on **mock fixtures** behind a stable service interface; the real-API swap is one file per service (`system_architecture.md §6`).
- **MVP = Dashboard, Financial, Transaction**, built in that order. Everything else is roadmap (`product_requirements.md §5`).
- **Only `auth` is a real feature.** `dashboard` currently holds template/demo widgets that MUST be **replaced** with the real UDN dashboard.
- **The shipped `src/index.css` is blue-tinted;** the true-neutral retune + `--success` token are in `design_system.md §3.1`. **Style by token _name_** so the retune is a one-file change.
- **Only role = `super-admin`** (all permissions = `["*"]`), but build the `<Can>` / `useCan` / `requirePermission` scaffold now.
- Admin is **English-only** (no i18n).

## Workflow (non-negotiable)

**Plan -> Approve -> Build.**

1. `/plan-feature` — @pm reads the context docs, writes **`PLAN.md`** (whole-scope), lists open decisions with recommended defaults, then **STOPS for your approval**. No implementation code in this stage.
2. `/build-feature <feature>` — @frontend + @api build **one** feature/screen, QA it, commit — then **STOP for approval** before the next. Planning is whole-scope; execution is per-feature.
3. Never invent business rules. Finance settlement/fees are deliberately **TBD** — surface them, don't guess. When unsure about design/architecture, present 2 options with a recommended default.

## Where things live

- `.agents/` — portable, agent-agnostic spec: `context/` (the 3 docs), `roles/` (pm, frontend, api_integrator, qa), `rules/`, `workflows/`, `skills/`, `agents.md` (roster/index).
- `.claude/` — Claude Code native layer: `agents/` (subagents), `agent-memory/` (per-agent MEMORY.md — read before, update after), `commands/`, `rules/` (always-on enforcement mirrors), `skills/` (incl. vendored **impeccable**), `output-styles/custom-components.md`, `hooks/format.sh`, `settings.json`.
- `src/` (per `system_architecture.md §3`): `features/*` (the app — isolated slices), `components/{ui,common,layouts}`, `routes/` (registry-only), `middlewares/authMiddleware.ts`, `store/`, `lib/{axios,react-query,utils}`, `types/{api.type,models}`, `config/env.ts`, `utils/`, `index.css`. `routeTree.gen.ts` is generated — never hand-edit.

## Commands

| Command                       | Does                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `/plan-feature [focus]`       | Whole-scope plan -> `PLAN.md`, then STOP for approval                 |
| `/build-feature <feature>`    | Build one feature (data + UI), QA, then STOP for approval             |
| `/qa-audit [feature\|global]` | Definition of Done -> `.artifacts/qa-log.md`                          |
| `/add-shadcn <component>`     | Add a shadcn primitive, restyle with neutral tokens                   |
| `/commit [scope]`             | One Conventional Commit + its log entry                               |
| `/typecheck`                  | `tsc --noEmit` + `eslint`, summarized                                 |
| `/log-change <slug>`          | Append a `logs/feature-changes/` entry                                |
| `/update-memory <agent>`      | Refresh an agent's `MEMORY.md`                                        |
| `/impeccable <mode> [target]` | Production-grade UI craft/critique (run `/impeccable init` first use) |

## Subagents (keep the main context clean)

`frontend-engineer` (screens/components), `api-integrator` (typed data layer + mock-swap seam), `qa-auditor` (read-only Definition of Done). Each reads its `.claude/agent-memory/<agent>/MEMORY.md` first and updates it after. Output styles don't reach subagents, so the custom-primitive rules are also in `.claude/rules/custom-components.md`.

## Always-on rules (`.claude/rules/`)

`project`, `react-typescript`, `tailwind-styling`, `custom-components`, `feature-isolation`, `rbac-security`, `accessibility`, `logging`, `memory-context`, `commit`. Digest:

- **Feature isolation** — no cross-feature imports; promote shared code up.
- **Custom primitives only** in feature TSX (`Box`/`Container`/`Text`/`Heading`/`Link`/`Image`); interactive controls -> shadcn/ui.
- **Tokens only** — no raw hex / palette classes; monochrome; color only via `text-success`/`text-destructive`/`chart-*`; numbers use `tabular-nums`.
- **Routing is registry-only**; guards (`requireAuth`/`requirePermission`) in `beforeLoad`, never in components.
- **Server data via TanStack Query only**; global client state via Zustand; mocks behind the service boundary.
- TS strict, no `any`. Green (`tsc` + `lint`) before commit. Never `Read`/commit `.env*`.

## MCP (`.mcp.json`)

`context7` (live TanStack/Tailwind v4/shadcn/Zod docs), `shadcn` (browse/install primitives), `chrome-devtools` (QA screenshots/console/perf), `figma` (pull frames/tokens from file `l7izBcDr0PtS2FUdMdHFk3` — Dashboard node `22011-2008`, components `22078-1614`).

## Hooks / formatting

A `PostToolUse` hook (`.claude/hooks/format.sh`) prettier-formats every `Edit`/`Write` on `.ts/.tsx/.css/.json`.

## Definition of Done

See `system_architecture.md §9` and `.agents/workflows/qa.md`. A feature is done only when it's isolated, tokens-only, both-theme correct, Figma-reconciled, type/lint-clean, `<Can>`-gated where privileged, tables have loading/empty/error states, and it carries a `logs/feature-changes/` entry.
