# Frontend Engineer — Project Memory (index)

> **STATUS:** `auth`, `dashboard`, `financial`, `transactions`, `integration` are all real, built features (MVP = Dashboard -> Financial -> Transaction, one approval gate at a time — all three now built, plus a same-day UI polish pass on transactions; **Integration was promoted from roadmap to active scope 2026-07-10** per `product_requirements.md §4.4` and built same-day). Backend is separate and **not built yet** — screens are backed by typed mock fixtures (coordinate with @api). `src/index.css` is retuned to true-neutral (`--success`, `--warning`, `--chart-1/2` exist) and now `@import "tw-animate-css"` (added 2026-07-10 — was missing, so every `animate-in`/`fade-in-0`/`zoom-in-95`/etc. class across 13 shadcn primitives — dialog, alert-dialog, dropdown-menu, select, tooltip, popover, sheet, drawer, etc. — was silently inert app-wide until this landed; don't remove it). Check `src/index.css` before touching it.

Detail lives in `topics/*.md` — read the relevant one before touching that area. This file is a one-line-per-entry index only.

## Project
UDN Admin Dashboard: monochrome (shadcn `neutral`), Inter everywhere, light+dark (dark default). Stack: React 19 + Vite + TanStack Router/Query/Table + Tailwind v4 + shadcn/ui (`new-york`) + Zustand + RHF/Zod + Axios + recharts + sonner + next-themes. Content/scope source = `.agents/context/`.

## Actual repo layout
- Routing registry: `src/routes/` — `__root.tsx`, `index.tsx`, `_auth/` (guest, `AuthLayout`), `_protected/` (auth, `DashboardLayout`). MVP screens under `_protected/{dashboard,financial,transactions}/` (registry-only + `requirePermission`, real as of 2026-07-10). See `topics/routing-patterns.md`.
- Providers (`src/main.tsx`): StrictMode -> `QueryClientProvider` -> `ThemeProvider` (still `defaultTheme="system"`, should be `"dark"`) -> `TooltipProvider` -> `RouterProvider` + `<Toaster />`. `routeTree.gen.ts` auto-regenerates on `npm run dev`/`npx vite build` — never hand-edit.
- Common primitives in `src/components/common/` (no barrel — import each file directly). shadcn primitives in `src/components/ui/` (full set incl. `table`, `chart`, `sidebar`, `dialog`, `pagination`, `tabs`, `avatar`). Layout chrome: `features/{dashboard,auth}/layouts/`.
- Tokens: `src/index.css` `@theme` — true-neutral, `--success`/`--warning`/`--destructive`/`--chart-1/2`. Global entities: `src/types/models/` (migrate `src/models/user.model.ts` here, not done yet). `cn()` in `src/lib/utils.ts`.

## Custom primitives (USE THESE — never bare HTML)
`Box` (polymorphic, replaces div/section/etc.), `Container` (`maxWidth` sm..7xl|full), `Text` (`as` p|span|div, `variant`), `Heading` (`level`/`variant`), `Image` (lazy+skeleton+fallback, only one allowed to render a raw `<img>`), `Link` (internal via TanStack `RouterLink`, external adds `rel`), `ThemeToggle` (no props). No barrel in `common/` — import each file directly (`@/components/common/Box`, not `@/components/common`). `Link`/`useNavigate` casting for not-yet-registered routes: see `topics/routing-patterns.md`.

## Routes registered so far
`/`, `/login`, `/dashboard`, `/financial`, `/finance-preview`, `/transactions` (redirects to `/transactions/automatic`), `/transactions/automatic`, `/transactions/manual`, `/transaction-preview` (dev-only), `/integration`, `/integration-preview` (dev-only). Route patterns (directory-layout + index redirect, preview-route, `requirePermission`, route-casting): `topics/routing-patterns.md`.

## Topbar breadcrumb (`DashboardNavbar.tsx`)
Was hardcoded to the literal string `"Dashboard"` on every screen until 2026-07-10 (fixed while building `integration`, whose reference showed a leftover "Financial" breadcrumb from copying the Figma frame). Now a `pathname -> title` lookup (`PAGE_TITLES` const + `getPageTitle()`, mirrors the sidebar's own `useLocation`-driven active-nav pattern) keyed by exact match or `${path}/` prefix. **New protected screens must add their path to `PAGE_TITLES`** or the topbar silently falls back to "Dashboard" — note the lookup only matches real paths like `/integration`, not preview-route paths like `/integration-preview` (by design; preview routes aren't meant to drive the breadcrumb).

## Shared workhorses (`src/components/common/`)
`StatCard`, `TrendPill`, `PerformanceChartCard`, `PendingOrdersCard`/`ActivityFeedCard`, `CopyableAmount` (feature-local, financial-only so far), `DataTable` (dashboard, client-mode), `Table`'s `containerClassName` prop, `Table`/`Button` now `forwardRef` (all added 2026-07-10). Full detail + promotion rules: `topics/shared-components.md`.

**`StatCard` extended 2026-07-10** (building `integration`, not a new card component): `deltaPct`/`direction` are now optional (only rendered as a `TrendPill` when both are set — dashboard/financial's existing usage is unaffected), plus new optional `icon` (leading `ComponentType`, rendered before the label), `iconClassName`, and `format: "currency" | "count"` (default `"currency"`; `"count"` renders `value.toLocaleString("id-ID")` instead of `formatCurrency`). Use this variant for any future "count + plain caption, no trend" stat card instead of building a new component.

## `integration` feature
Built 2026-07-10 (promoted from roadmap same day, per `product_requirements.md §4.4`). Connectivity-monitoring screen: header/subcopy, 3 `StatCard`s (icon+count variant above), a 5-option category filter (shadcn `Tabs`, `variant="line"`, no separate `TabsContent` per category — single `TabsContent value={category}` wrapping the whole filtered grid, controlled via `useState`, same pattern as Dashboard's performance tabs), and a `ChannelCard` grid (logo-or-placeholder-square, currency/config line, connection-status `Badge` + balance `Badge` + kebab `DropdownMenu` with 3 inert toast-stub items). `IntegrationChannel` is feature-local + snake_case (`types/integration.type.ts`), deliberately separate from financial's camelCase money types even where channel names overlap (e.g. "UxioPay") — connectivity vs. money are different concerns per the PRD, don't merge them.

## `transactions` feature
Built 2026-07-10 (data layer + UI/routing), polished same day (full-width color-coded status-pill grid + new `--warning` token, rounded filter/table/modal fields, real horizontal-scroll table scrollbar, shadcn `Pagination` primitive with a numbered page window, more pronounced modal transition). `TransactionsTable` (server-mode, sibling to `DataTable`), `RowActionMenu`, the native drag-and-drop dropzone pattern, `TransactionFilterBar`, `StatusBadge`/`StatusPills`, plus test/lint gotchas (label collisions, `react-refresh/only-export-components`, hidden-file-input `user-event.upload()`). Full detail: `topics/transactions-feature.md`.

## Testing (TDD, mandatory)
Vitest + RTL on `jsdom`, harness in `src/test/` (`setup.ts`, `test-utils.tsx`'s `renderRoute`). Test-first always: cases -> failing tests -> green. Accessible queries only, never className/token strings. Gotchas (auth-seeding, `find*` vs `get*` for query-loaded content, clipboard stub, hidden-file-input uploads, never scope by className): `topics/testing-patterns.md`.

## Conventions / DRY
- TS strict, no `any`. `cn()` for conditional classes, `cva` for variants. Functional components, named exports.
- **Tokens only** (no raw hex/px, no `slate-`/`zinc-`/`gray-`); monochrome; color only via `text-success`/`text-warning`/`text-destructive`/`chart-*`. Numbers use `tabular-nums`; money via `formatCurrency` (`src/utils/currency.ts`, takes an optional `{ fractionDigits }`, default 2).
- Radius `--radius: 0.375rem` (`rounded-md`); bump via `rounded-xl`/`rounded-2xl` utility overrides at the call site for a single screen's "more rounded" ask — never edit `components/ui/*` for a one-screen request (see `topics/transactions-feature.md`'s Edit dialog note).
- Reuse existing common components + the shared workhorses before writing new ones. Record new shared pieces in the relevant topic file, then add a one-line pointer here.

## Tooling
- MCP: **context7** (live docs, prefer over memory), **shadcn** (search/install, pairs with `/add-shadcn`), **chrome-devtools** (QA screenshots), **figma** (UDN Admin Dashboard file `l7izBcDr0PtS2FUdMdHFk3` — access has been denied in-session before; don't assume it's reachable).
- Design skill: **impeccable** (`.claude/skills/impeccable/`, `/impeccable init` first use).
- Prettier PostToolUse hook auto-formats every Edit/Write.

## Decisions log (durable facts only)
- Global entities live in `src/types/models/` (migrate from `src/models/`, not done yet); axios stays in `src/lib/axios.ts`.
- API is separate + not built -> services are mock-backed (fixtures in `features/<f>/data/`) behind a stable interface; swap to real HTTP later per `system_architecture.md §6`.
- Only role = `super-admin` (`["*"]`); `<Can>`/`useCan`/`requirePermission` scaffold is real (added 2026-07-10, see `topics/routing-patterns.md`).
- Admin is English-only (no i18n); monochrome neutral (not the consumer Neon Violet); Inter for everything.
- Design-token exceptions are additive-by-approval only: `--success`, `--destructive`, `--warning` (2026-07-10, user-approved for the Pending status pill) — ask before adding a 4th functional color.
