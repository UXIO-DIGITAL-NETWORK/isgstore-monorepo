# CLAUDE.md — Uxio Payment Page

Master brief for Claude Code in this repo. It points at the deeper specs; it does **not** duplicate them.

## What this is

The **payment page** SPA for Uxio — a merchant-settlement dashboard on top of the
existing top-up platform, modelled on FastQR/Monetapay. It serves **two roles from one
app**, chosen by the signed-in user's role name:

- **`finance`** = "kita" (platform operator): every merchant, all transactions, the
  platform's own profit balance, and withdrawal approval.
- **`finance-developer`** = "client" (merchant): its own balance, transactions, mutasi
  (ledger), and withdrawal requests.

It was scaffolded from `web-admin-topup-fe` and deliberately mirrors its structure,
config, and conventions. It talks to the **same** Laravel API (`web-topup-api`) under the
`/v1/merchant/*` and `/v1/finance/*` route groups; deploy behind a subdomain.

**Monochrome** (shadcn `neutral`), **Inter**, **light + dark (dark default)**. Stack:
**React 19 + Vite + TypeScript (strict) + Tailwind v4 + shadcn/ui (`new-york`) + TanStack
Router/Query/Table + Zustand + React Hook Form + Zod + Axios + sonner + next-themes**.
Testing: **Vitest + React Testing Library**.

## Authoritative documents (read before any task)

Precedence when they conflict:

1. `.agents/context/system_architecture.md` — **how** we build (highest precedence)
2. `.agents/context/product_requirements.md` — **what** we build (scope/content)
3. `.agents/context/design_system.md` — the **look** (tokens, components)
4. this `CLAUDE.md` — operating rules that tie it together

## Project reality (important)

- **Backend is live.** Services call the real API through `@/lib/axios`; the response
  interceptor returns the full `{status,code,message,data}` envelope. Use `@/lib/list`'s
  `unwrapList` to normalise the two pagination shapes (Resource collection vs raw
  paginator).
- **Two roles, role-name based.** Permissions come from the role NAME, not `role_id`
  (`@/constants/roles`): `finance` → `["finance"]`, `finance-developer` → `["merchant"]`.
  Routes guard with `requireFinance` / `requireMerchant` in `beforeLoad`; the sidebar
  (`features/dashboard/components/DashboardSidebar.tsx`) switches nav on the role.
- **Feature slices**: `merchant` (client view) and `finance` (kita view); `dashboard`
  holds the shared shell (layout, sidebar, navbar); `auth` is login. Shared table/badge/
  pager primitives live in `components/common`.
- **UI-first anywhere the API is missing** — build typed screens behind the service
  interface; a swap is one file per service.
- **Style by token _name_** (monochrome; color only via `text-success`/`text-destructive`);
  numbers use `tabular-nums`; money via `@/utils/currency`.
- **Prefer TDD** for new features: test cases → failing tests → green. Colocated
  `*.test.tsx`, Vitest + React Testing Library.
- The `.agents/` / `.claude/` specs and some sections below are inherited from the admin
  repo and may still reference admin-only scope — treat this file's top sections as
  authoritative for the payment page.

## Workflow (non-negotiable)

**Plan -> Approve -> Build.**

1. `/plan-feature` — @pm reads the context docs, writes **`PLAN.md`** (whole-scope), lists open decisions with recommended defaults, then **STOPS for your approval**. No implementation code in this stage.
2. `/build-feature <feature>` — @frontend + @api build **one** feature/screen **test-first** (write the test cases, write the failing tests, then implement until green — `system_architecture.md §4.11`), QA it, commit — then **STOP for approval** before the next. Planning is whole-scope; execution is per-feature.
3. Never invent business rules. Finance settlement/fees are deliberately **TBD** — surface them, don't guess. When unsure about design/architecture, present 2 options with a recommended default.

## Where things live

- `.agents/` — portable, agent-agnostic spec: `context/` (the 3 docs), `roles/` (pm, frontend, api_integrator, qa), `rules/`, `workflows/`, `skills/`, `agents.md` (roster/index).
- `.claude/` — Claude Code native layer: `agents/` (subagents), `agent-memory/` (per-agent MEMORY.md — read before, update after), `commands/`, `rules/` (always-on enforcement mirrors), `skills/` (incl. vendored **impeccable**), `output-styles/custom-components.md`, `hooks/format.sh`, `settings.json`.
- `src/` (per `system_architecture.md §3`): `features/*` (the app — isolated slices), `components/{ui,common,layouts}`, `routes/` (registry-only), `middlewares/authMiddleware.ts`, `store/`, `lib/{axios,react-query,utils}`, `types/{api.type,models}`, `config/env.ts`, `utils/`, `test/` (Vitest harness — `setup.ts`, `test-utils.tsx`), `index.css`. `routeTree.gen.ts` is generated — never hand-edit.

## Commands

| Command                       | Does                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| `/plan-feature [focus]`       | Whole-scope plan -> `PLAN.md`, then STOP for approval                       |
| `/build-feature <feature>`    | Build one feature TDD-first (tests before code), QA, then STOP for approval |
| `/qa-audit [feature\|global]` | Definition of Done -> `.artifacts/qa-log.md`                                |
| `/add-shadcn <component>`     | Add a shadcn primitive, restyle with neutral tokens                         |
| `/commit [scope]`             | One Conventional Commit + its log entry                                     |
| `/typecheck`                  | `tsc -b --force` + `eslint`, summarized                                       |
| `/log-change <slug>`          | Append a `logs/feature-changes/` entry                                      |
| `/update-memory <agent>`      | Refresh an agent's `MEMORY.md`                                              |
| `/impeccable <mode> [target]` | Production-grade UI craft/critique (run `/impeccable init` first use)       |

## Subagents (keep the main context clean)

`frontend-engineer` (screens/components), `api-integrator` (typed data layer + mock-swap seam), `qa-auditor` (read-only Definition of Done). Each reads its `.claude/agent-memory/<agent>/MEMORY.md` first and updates it after. Output styles don't reach subagents, so the custom-primitive rules are also in `.claude/rules/custom-components.md`.

## Always-on rules (`.claude/rules/`)

`project`, `react-typescript`, `tailwind-styling`, `custom-components`, `feature-isolation`, `rbac-security`, `accessibility`, `logging`, `memory-context`, `commit`, `testing-strategy`. Digest:

- **Feature isolation** — no cross-feature imports; promote shared code up.
- **Custom primitives only** in feature TSX (`Box`/`Container`/`Text`/`Heading`/`Link`/`Image`); interactive controls -> shadcn/ui.
- **Tokens only** — no raw hex / palette classes; monochrome; color only via `text-success`/`text-destructive`/`chart-*`; numbers use `tabular-nums`.
- **Routing is registry-only**; guards (`requireAuth`/`requirePermission`) in `beforeLoad`, never in components.
- **Server data via TanStack Query only**; global client state via Zustand; mocks behind the service boundary.
- **TDD, always:** test cases → failing tests → implementation to green. Colocated `*.test.tsx`, Vitest + React Testing Library. Never loosen/delete a test to pass it.
- TS strict, no `any`. Green (`tsc` + `lint` + `test`) before commit. Never `Read`/commit `.env*`.

## MCP (`.mcp.json`)

`context7` (live TanStack/Tailwind v4/shadcn/Zod docs), `shadcn` (browse/install primitives), `chrome-devtools` (QA screenshots/console/perf), `figma` (pull frames/tokens from file `l7izBcDr0PtS2FUdMdHFk3` — Dashboard node `22011-2008`, components `22078-1614`).

## Hooks / formatting

A `PostToolUse` hook (`.claude/hooks/format.sh`) prettier-formats every `Edit`/`Write` on `.ts/.tsx/.css/.json`.

## Definition of Done

See `system_architecture.md §9` and `.agents/workflows/qa.md`. A feature is done only when it's built **TDD-first** with `npm run test` passing, isolated, tokens-only, both-theme correct, Figma-reconciled, type/lint-clean, `<Can>`-gated where privileged, tables have loading/empty/error states, and it carries a `logs/feature-changes/` entry.
