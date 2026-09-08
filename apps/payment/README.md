# ISG Store Admin Dashboard

Internal back-office single-page application for managing the **ISG Store multi-game top-up platform** — monitoring, financial oversight, and transaction operations for a single Super Admin operator.

> Monochrome (shadcn `neutral`) · React 19 · TypeScript strict · Tailwind CSS v4 · TanStack Router/Query/Table

---

## Table of Contents

- [Overview](#overview)
- [Project Status](#project-status)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture & Conventions](#architecture--conventions)
- [Design System](#design-system)
- [AI-Assisted Development Workflow](#ai-assisted-development-workflow)
- [Roadmap](#roadmap)
- [Contributing / Workflow Discipline](#contributing--workflow-discipline)
- [Documentation Index](#documentation-index)
- [License](#license)

---

## Overview

ISG Store Admin Dashboard gives a single operator ("Super Admin") a data-dense control surface to:

- **Monitor** platform health — balances, daily sales, revenue vs. net income trends, pending order queues, recent activity.
- **Oversee finances** — aggregate money movement, revenue/net-income reporting, exportable financial recaps.
- **Operate transactions** — search, filter, inspect, and act on every top-up transaction (status override, refund, re-trigger provider callback, resend receipt, export, recaps).

This admin app runs against a **separate backend/service** from the public-facing "ISG Store Website" (the consumer platform). It does not share the consumer frontend, database, or design identity — the consumer site uses a Near-Black + Neon Violet brand; this admin uses **pure monochrome**.

## Project Status

**Phase: UI-first.** The dedicated admin API is **not built yet**, so this phase focuses on building fully typed screens against mock fixtures behind a stable service interface — the swap to real HTTP is a one-file change per service once the backend contract lands. See [`system_architecture.md §6`](.agents/context/system_architecture.md).

**MVP scope (in build order):** Dashboard → Financial → Transaction. Everything else (Product, Promo, Content, Payment Methods, Users, Membership, Settings/SEO, Integration, Audit Logs) is [roadmap](#roadmap).

| Area                                                              | State                   | Notes                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth** (`features/auth`)                                        | ✅ Built                | Login/Register/Logout, token in cookie, "remember me". 2FA fields reserved, not active.                                                                                                                                                                                                                                                                            |
| **App shell** (`DashboardLayout`, sidebar, topbar, `ThemeToggle`) | ✅ Built                | Needs the monochrome retune (see below) and full nav per the target IA.                                                                                                                                                                                                                                                                                            |
| **Dashboard** (`features/dashboard`)                              | 🚧 Placeholder          | Currently holds **template/demo widgets** (`OverviewCards`, `PaymentsTable`, `SprintProgress`, `SubscriptionsChart`, `TeamActivity`, `TeamMembersList`, `SaleActivityChart`) that must be **replaced** with the real ISG Store dashboard (welcome banner, balance stat cards, Monthly Performance chart, Pending Orders, Recent Log Activity, tabbed performance table). |
| **Financial**                                                     | 📋 Not started          | MVP, next after Dashboard. Business logic (settlement/fees) is intentionally TBD — see PRD.                                                                                                                                                                                                                                                                        |
| **Transaction**                                                   | 📋 Not started          | MVP, last of the three.                                                                                                                                                                                                                                                                                                                                            |
| **Design tokens** (`src/index.css`)                               | ⚠️ Needs retune         | Currently ships shadcn's default **blue-tinted** palette. Target is true-neutral monochrome + a new `--success` token — see [`design_system.md §3.1`](.agents/context/design_system.md) for the paste-in replacement.                                                                                                                                              |
| **`features/home`** (`HomePage`, `HeroSection`, `FeatureCards`)   | ⛔ Boilerplate leftover | A generic marketing/landing template mounted at `/`. Not part of the admin PRD — confirm with the team whether to delete or repurpose before it accumulates dependents.                                                                                                                                                                                            |
| **AI-agent infrastructure** (`.agents/`, `.claude/`)              | ✅ Built                | See [AI-Assisted Development Workflow](#ai-assisted-development-workflow).                                                                                                                                                                                                                                                                                         |

## Tech Stack

| Category         | Library                                                                                                                    | Version                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Core**         | React                                                                                                                      | `^19.2.0`                                                |
|                  | TypeScript                                                                                                                 | `~5.9.3` (strict)                                        |
|                  | Vite                                                                                                                       | `^7.3.1`                                                 |
| **Routing**      | TanStack Router (file-based, type-safe)                                                                                    | `^1.162.8`                                               |
| **Server state** | TanStack Query                                                                                                             | `^5.90.21`                                               |
| **Data tables**  | TanStack Table                                                                                                             | `^8.21.3`                                                |
| **Client state** | Zustand                                                                                                                    | `^5.0.11`                                                |
| **Forms**        | React Hook Form                                                                                                            | `^7.71.2`                                                |
|                  | Zod                                                                                                                        | `^4.3.6`                                                 |
|                  | @hookform/resolvers                                                                                                        | `^5.2.2`                                                 |
| **HTTP**         | Axios                                                                                                                      | `^1.13.5`                                                |
| **Styling**      | Tailwind CSS                                                                                                               | `^4.2.1` (`@theme`, no config file)                      |
|                  | shadcn/ui (`new-york`, base `neutral`) + Radix/base-ui                                                                     | —                                                        |
|                  | class-variance-authority (`cva`) / clsx / tailwind-merge                                                                   | —                                                        |
| **Charts**       | Recharts                                                                                                                   | `^2.15.4`                                                |
| **Misc UI**      | sonner (toasts), cmdk (command palette), vaul (drawer), next-themes, date-fns, react-day-picker, embla-carousel, input-otp | —                                                        |
| **Utilities**    | js-cookie, lucide-react (icons)                                                                                            | —                                                        |
| **Testing**      | Vitest                                                                                                                     | — (added when the test harness is first set up)          |
|                  | React Testing Library (`@testing-library/react`, `jest-dom`, `user-event`) + `jsdom`                                       | —                                                        |
| **Tooling**      | ESLint 9 (flat config)                                                                                                     | `^9.39.3`                                                |
|                  | Prettier                                                                                                                   | (devDependency; auto-run by the Claude Code format hook) |

Full pinned versions: [`package.json`](package.json).

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 7 — check with `node -v`)
- **npm** (ships with Node; the repo uses `package-lock.json`)
- No local backend/database required for this phase — the app runs entirely against mock data behind the service layer.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment file (see Environment Variables below)
cp .env.example .env    # if .env is not already present

# 3. Start the dev server (Vite, with HMR)
npm run dev

# 4. Open the app
# → http://localhost:5173
```

To build for production:

```bash
npm run build       # tsc -b && vite build → outputs to dist/
npm run preview      # serve the production build locally
```

## Environment Variables

Defined in `.env` (never commit this file — it's gitignored):

| Variable            | Example                      | Description                                                                                                                                                                                                       |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/` | Base URL of the admin backend (Laravel, separate service). Read via `src/config/env.ts` (`ENV.API_BASE_URL`). Not required to be reachable during the UI-first phase — services fall back to typed mock fixtures. |

## Available Scripts

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the Vite dev server with hot module reload.      |
| `npm run build`      | Type-check (`tsc -b`) then production-build with Vite. |
| `npm run lint`       | Run ESLint (flat config, `eslint.config.js`).          |
| `npm run preview`    | Serve the built `dist/` output locally.                |
| `npm run test`       | Run the Vitest suite once (CI-friendly).               |
| `npm run test:watch` | Run Vitest in watch mode for the TDD loop.             |

Every feature in this repo is built **test-first** — see [AI-Assisted Development Workflow](#ai-assisted-development-workflow). `npm run test`, alongside `tsc`/`lint`, is a required gate before any commit.

## Project Structure

```text
.
├── .agents/                  # Portable AI-agent spec (context docs, roles, rules, workflows, skills)
├── .claude/                  # Claude Code native layer (subagents, commands, hooks, settings)
├── logs/feature-changes/     # Append-only change log (see Contributing)
├── src/
│   ├── assets/                # Static files (still has the default Vite react.svg — cleanup pending)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (53 installed: table, chart, sidebar, dialog, command, …)
│   │   ├── common/              # HTML-element replacements: Box, Text, Heading, Container, Image, Link, ThemeToggle
│   │   │                        #   ⚠️ no barrel yet — import each directly, e.g. "@/components/common/Box"
│   │   └── layouts/             # RootLayout
│   ├── config/
│   │   └── env.ts               # import.meta.env.VITE_* only
│   ├── constants/
│   │   └── images.ts
│   ├── features/                # 📦 Feature-based modules — see Architecture & Conventions
│   │   ├── auth/                  # ✅ Built: services, hooks, schemas, types, layouts, pages
│   │   ├── dashboard/              # 🚧 Layout/shell built; widgets are demo placeholders to replace
│   │   ├── home/                    # ⛔ Boilerplate landing page, mounted at "/" — likely to be removed
│   │   ├── financial/                # 📋 To be created
│   │   └── transactions/              # 📋 To be created
│   ├── hooks/                    # Global hooks: useMobile, useTheme
│   ├── lib/
│   │   ├── axios.ts               # Configured `api` instance + interceptors (Bearer inject, response unwrap, 401 → logout)
│   │   ├── react-query.ts          # Currently empty — QueryClient is still inline in main.tsx
│   │   └── utils.ts                 # cn() (clsx + tailwind-merge)
│   ├── middlewares/
│   │   └── authMiddleware.ts       # requireAuth(), requireGuest() — requirePermission() to be added
│   ├── models/
│   │   └── user.model.ts           # ⚠️ Pending migration → src/types/models/
│   ├── providers/
│   │   └── theme-provider.tsx      # next-themes wrapper
│   ├── routes/                   # 📍 Registry only — no JSX/logic, just path → component → beforeLoad
│   │   ├── __root.tsx
│   │   ├── index.tsx               # "/" → HomePage (features/home)
│   │   ├── _auth/                   # Guest-only group (requireGuest) → AuthLayout
│   │   ├── _protected.tsx           # Authenticated group (requireAuth) → DashboardLayout
│   │   └── _protected/dashboard/    # "/dashboard"
│   ├── store/
│   │   └── useAuthStore.ts          # token (access_token cookie via js-cookie), remember-me expiry
│   ├── test/                     # 📋 Vitest harness (not yet created — set up on first feature build)
│   │   ├── setup.ts                # jest-dom matchers + window.matchMedia stub
│   │   └── test-utils.tsx           # renderRoute() — real router + fresh QueryClient + ThemeProvider
│   ├── types/
│   │   ├── api.type.ts              # ApiResponse<T>, ApiError — PaginatedResponse<T> to be added
│   │   └── models/                  # 📋 Target location for global entities (not yet created)
│   ├── utils/                     # Currently empty — formatCurrency/formatDate to be added
│   ├── index.css                  # Tailwind v4 @theme tokens — blue-tinted, retune pending
│   ├── main.tsx                   # Provider stack bootstrap
│   └── routeTree.gen.ts           # 🤖 Auto-generated by @tanstack/router-plugin — never hand-edit
├── components.json             # shadcn config: new-york, base "neutral", icons via lucide
├── vite.config.ts               # Plugin order: tanstackRouter → react → tailwindcss()
├── vitest.config.ts              # 📋 Not yet created — react() + "@" alias + jsdom, separate from vite.config.ts
├── CLAUDE.md                    # Master brief for Claude Code (points into .agents/context/)
├── AGENTS.md                    # Cross-tool agent overview
└── .mcp.json                    # MCP servers: context7, shadcn, chrome-devtools, figma
```

Path alias `@/` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Architecture & Conventions

The full, authoritative rules live in [`.agents/context/system_architecture.md`](.agents/context/system_architecture.md) (highest-precedence document in this repo). Digest:

- **Feature isolation is absolute.** A module under `src/features/<feature>/` never imports another feature's internals — only its `index.ts` barrel. Shared code is promoted to `components/common`, `lib`, `utils`, `hooks`, or `types/models`.
- **Routes are a registry, not a UI layer.** `src/routes/` files only wire `path → component → beforeLoad`. Auth/permission guards live in `src/middlewares/authMiddleware.ts`, called from `beforeLoad` — never inline in components.
- **State is split strictly:** server/API data → TanStack Query only; global client state → Zustand (`src/store/`); local state → `useState`.
- **API layer:** each feature exposes a typed service (`api/`/`services/`) consumed via TanStack Query hooks — never call `api` (the shared Axios instance in `src/lib/axios.ts`) directly from a component. This phase, services are backed by **typed mock fixtures** in `features/<f>/data/`, swappable to real HTTP with a one-file change.
- **Response envelopes:** `ApiResponse<T>` (single/action) and a to-be-added `PaginatedResponse<T>` (Laravel paginator shape) for server-side tables.
- **Authorization scaffold:** only `super-admin` exists today (all permissions), but the RBAC plumbing (`requirePermission` in `beforeLoad`, `<Can>` component, `useCan()` hook) is built now so future roles are a data change, not a refactor.
- **Forms:** React Hook Form + Zod via `@hookform/resolvers/zod`; schemas in `schemas/`, inferred types in `types/`.
- **Components:** `components/ui/` = shadcn primitives only; `components/common/` = polymorphic HTML-element replacements (prefer these over raw `div`/`p`/`span`/`img`/`a` in feature code); `cn()` for conditional classes, `cva` for variants.
- **Testing is TDD, no exceptions:** every page/component/service/hook is built by writing the test cases first, writing them as failing tests, then implementing to green — see [AI-Assisted Development Workflow](#ai-assisted-development-workflow) and `system_architecture.md §4.11`.

## Design System

Full spec: [`.agents/context/design_system.md`](.agents/context/design_system.md). Pixel source of truth: the [ISG Store Admin Dashboard Figma file](https://www.figma.com/design/l7izBcDr0PtS2FUdMdHFk3/UDN-Admin-Dashboard) (Dashboard frame `22011-2008`, components `22078-1614`).

- **Palette:** pure monochrome, shadcn `neutral` base color. Color is used only functionally — green (`text-success`) for positive trends, red (`text-destructive`) for negative/destructive actions, blue/green for the two chart series.
- **Themes:** light + dark, **dark is default**. Both must reach full parity.
- **Typography:** **Inter for everything**, including numbers — use `tabular-nums` for aligned figures (money via a shared `formatCurrency` util).
- **Radius/elevation:** `--radius: 0.375rem`; structure comes from hairline borders and spacing, not shadows — soft shadows are reserved for floating layers (dropdowns, dialogs, popovers).
- **Tokens only** — no raw hex or `slate-`/`zinc-`/`gray-` palette classes anywhere in app code.

## AI-Assisted Development Workflow

This repo ships with a full AI-agent scaffold under `.agents/` (portable, tool-agnostic spec) and `.claude/` (Claude Code native layer). The rhythm is strict: **Plan → Approve → Build.**

1. **`/plan-feature`** — the `@pm` role reads `.agents/context/`, writes a whole-scope `PLAN.md`, lists open decisions with recommended defaults, then **stops and waits for explicit approval**. No code is written at this stage.
2. **`/build-feature <feature>`** — `@frontend` + `@api` build **one** feature/screen end-to-end, **test-first at every layer**: define the test cases against the PRD spec, write them as failing tests, then implement until green (typed mock-backed data layer → UI → wiring). Run QA, commit — then **stop for approval** before the next feature.
3. **`/qa-audit`** — `@qa` runs the Definition of Done (tests, type-safety, feature isolation, design-token fidelity, both-theme rendering, authorization gating, accessibility) and writes findings to `.artifacts/qa-log.md`. Read-only on source.

**Testing is TDD, always.** Stack: Vitest + React Testing Library on `jsdom`. Every page/component/service/hook is built by writing the test cases first, writing them as failing tests, confirming they fail for the right reason, then implementing to green — never the reverse, and never loosened to force a pass. Tests are colocated (`Thing.tsx` + `Thing.test.tsx`) with a shared harness in `src/test/`. Full detail: `system_architecture.md §4.11`.

| Command                       | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `/plan-feature [focus]`       | Whole-scope plan → `PLAN.md`, then stop for approval                    |
| `/build-feature <feature>`    | Build one feature TDD-first (tests before code), then stop for approval |
| `/qa-audit [feature\|global]` | Definition-of-Done audit                                                |
| `/add-shadcn <component>`     | Add a shadcn primitive, restyled with our tokens                        |
| `/commit [scope]`             | One Conventional Commit + its log entry                                 |
| `/typecheck`                  | `tsc --noEmit` + `eslint`, summarized                                   |
| `/log-change <slug>`          | Append a `logs/feature-changes/` entry                                  |
| `/update-memory <agent>`      | Refresh a subagent's `MEMORY.md`                                        |
| `/impeccable <mode> [target]` | Production-grade UI craft/critique (vendored skill, v3.9.1)             |

**Subagents** (`.claude/agents/`): `frontend-engineer`, `api-integrator`, `qa-auditor` — each reads its own `.claude/agent-memory/<agent>/MEMORY.md` before starting and updates it after, keeping durable project knowledge separate from the append-only change log.

**MCP servers** (`.mcp.json`): `context7` (live library docs), `shadcn` (component registry), `chrome-devtools` (screenshots/console/perf for QA), `figma` (pull frames/tokens from the design file).

See [`.agents/agents.md`](.agents/agents.md) for the full team roster and [`CLAUDE.md`](CLAUDE.md) for the complete operating brief.

## Roadmap

Post-MVP modules (architecture and navigation already accommodate these; not built yet):

- **Product** — Game → Product (nominal) catalog, cost/sell price, provider SKU mapping, availability toggle.
- **Promo** — type/scope/quota/validity-window/minimum-purchase promo engine; Flash Sale as a time-boxed variant.
- **Website Content** — manage the consumer homepage: banners, articles, testimonials, payment-method logos.
- **Payment Methods** — enable/disable channels, fee configuration.
- **Users** — consumer-facing user management: profile, wallet/balance, transaction history, suspend/ban.
- **Membership**, **Settings/SEO**, **Integration**, **Audit Logs**, dedicated **Reports** hub.
- **Security** — 2FA (TOTP) for admin login (fields already reserved on the user model).

Full detail: [`product_requirements.md §5`](.agents/context/product_requirements.md).

## Contributing / Workflow Discipline

- **Plan before you build.** Every non-trivial change starts with an approved plan — no silent architectural or business-logic decisions. If something in the PRD/design is ambiguous or a business rule is undefined (e.g. Finance settlement/fees), **surface it as an open question with a recommended default** instead of guessing.
- **Test-first, always.** Write the test cases, write the failing tests, then implement until green — for every page, component, service, and hook, no exceptions. Never loosen or delete a test to make it pass; if a test is wrong against the spec, fix the test and say so.
- **One feature per approval gate.** Build order follows the locked MVP sequence; don't start the next screen before the current one is reviewed.
- **Definition of Done** (full checklist in [`system_architecture.md §9`](.agents/context/system_architecture.md)): built TDD-first with `npm run test` passing, feature-isolated, tokens-only, renders correctly in both light and dark, reconciled against Figma, zero TypeScript/ESLint errors, no `any`, server-side tables have loading/empty/error states, destructive actions are permission-gated with confirmation + toast.
- **Commits:** Conventional Commits (`type(scope): summary`), one logical unit per commit, green `tsc`/`lint` before committing. Full rules: [`.agents/rules/commit-rules.md`](.agents/rules/commit-rules.md).
- **Log every change:** append an entry to `logs/feature-changes/` (from `TEMPLATE.md`) describing what/why/files/verification, committed alongside the change it documents.

## Documentation Index

| Document                                                                             | Purpose                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [`.agents/context/product_requirements.md`](.agents/context/product_requirements.md) | What we build — scope, screens, entities, roadmap                                 |
| [`.agents/context/system_architecture.md`](.agents/context/system_architecture.md)   | How we build — structure, patterns, RBAC, Definition of Done (highest precedence) |
| [`.agents/context/design_system.md`](.agents/context/design_system.md)               | The look — tokens, typography, component specs, Figma references                  |
| [`CLAUDE.md`](CLAUDE.md)                                                             | Master operating brief for Claude Code in this repo                               |
| [`AGENTS.md`](AGENTS.md)                                                             | Cross-tool agent overview (any AI coding agent)                                   |
| [`.agents/agents.md`](.agents/agents.md)                                             | Agent team roster, commands, and skill index                                      |

## License

Proprietary — internal tool for the ISG Store top-up platform. Not licensed for external use or distribution.
