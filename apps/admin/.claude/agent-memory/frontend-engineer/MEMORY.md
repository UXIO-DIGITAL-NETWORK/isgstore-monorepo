# Frontend Engineer — Project Memory

> **STATUS:** greenfield admin, UI-first. Only `auth` is a real feature; `dashboard` holds **template/demo widgets to replace**. MVP = **Dashboard -> Financial -> Transaction**, built one approval gate at a time. Backend is separate and **not built yet** — screens are backed by typed mock fixtures (coordinate with @api). The shipped `src/index.css` is **blue-tinted**; the neutral retune + `--success` are pending (`design_system.md §3.1`).

## Project
UDN Admin Dashboard: monochrome (shadcn `neutral`), Inter everywhere, light+dark (dark default). Stack: React 19 + Vite + TanStack Router/Query/Table + Tailwind v4 + shadcn/ui (`new-york`) + Zustand + RHF/Zod + Axios + recharts + sonner + next-themes. Content/scope source = `.agents/context/`.

## Actual repo layout
- Routing registry: `src/routes/` — `__root.tsx`, `index.tsx`, `_auth/` (guest, `AuthLayout`), `_protected/` (auth, `DashboardLayout`). MVP screens go under `_protected/{dashboard,financial,transactions}/` (registry-only + `requirePermission`).
- Providers (`src/main.tsx`): StrictMode -> `QueryClientProvider` (client inline — move to `lib/react-query.ts`) -> `ThemeProvider` (currently `defaultTheme="system"` -> set `"dark"`, `storageKey="vite-ui-theme"`) -> `TooltipProvider` -> `RouterProvider`. **No `<Toaster />` yet — mount sonner.** `routeTree.gen.ts` auto-regenerates — never hand-edit.
- Common primitives + barrel in `src/components/common/`. shadcn primitives in `src/components/ui/` (full set incl. `table`, `chart`, `sidebar`, `dialog`, `command`, `dropdown-menu`, `badge`, `skeleton`, `sonner`, `pagination`, `tabs`, `avatar`). Layout chrome: `features/{dashboard,auth}/layouts/`.
- Tokens: `src/index.css` `@theme` (blue-tinted now; neutral retune pending). Global entities: `src/types/models/` (migrate `src/models/user.model.ts` here). `cn()` in `src/lib/utils.ts`.

## Custom primitives (USE THESE — never bare HTML)
- `Box` — polymorphic; `<Box as="section" className=…>`; spreads native props, no styling of its own. Replaces div/section/article/header/footer/nav/ul/li.
- `Container` — `<Container as="section" maxWidth="7xl" centerContent?>`; adds `mx-auto px-4 sm:px-6 lg:px-8`. `maxWidth`: sm..7xl|full.
- `Text` — `<Text as="p|span|div" variant="default|lead|large|small|muted">`. Variants map to token text/color classes. Replaces p/span.
- `Heading` — `<Heading level={1..6} variant="default|display|title|subtitle|section">` (or `as="h2"`). Replaces h1–h6.
- `Image` — `<Image src alt width height objectFit priority quality placeholder fallback>`; lazy + skeleton + fallback built in. Renders a raw `<img>` internally (allowed there).
- `Link` — `<Link href replace scroll target rel>`; internal via TanStack `RouterLink`, external adds `rel`.
- `ThemeToggle` — no props; toggles theme (icon button with `sr-only` label — copy this a11y pattern for icon buttons).
- Import: `import { Box, Heading, Text } from "@/components/common";`.

## Shared workhorses to build (then reuse across features)
- `StatCard` — label + `TrendPill` (top-right) + big value (`text-3xl font-semibold tabular-nums`) + caption. Used by Dashboard cards + Financial overview.
- `TrendPill` — `cva` variants `up` (`bg-success/10 text-success` + ArrowUpRight) / `down` (`bg-destructive/10 text-destructive` + ArrowDownRight); `rounded-full px-2 py-0.5 text-xs tabular-nums`.
- `PerformanceChartCard` — recharts area via shadcn `chart` wrapper; series `chart-1` (Revenue, blue) + `chart-2` (Net Income, green); month/range `Select` in header. Used by Dashboard + Financial.
- `DataTable` — `@tanstack/react-table` **server mode** + shadcn `table`; server params -> `PaginatedResponse<T>`; compact rows `h-11`, numeric cols right-aligned `tabular-nums`, entity cell avatar+name, `Badge` status, `dropdown-menu` row actions (`<Can>`-gated), Skeleton/empty/error states. Used by Transactions + ledger.

## Conventions / DRY
- TS strict, no `any`. `cn()` for conditional classes, `cva` for variants. Functional components, named exports.
- **Tokens only** (no raw hex/px, no `slate-`/`zinc-`/`gray-`); monochrome; color only via `text-success`/`text-destructive`/`chart-*`. Numbers use `tabular-nums`; money via `formatCurrency` (`src/utils/`).
- Style by token *name* until the neutral retune lands. Radius `--radius: 0.375rem`; hairline borders over shadows.
- Reuse existing common components + the shared workhorses before writing new ones. Record new shared pieces here.

## Tooling
- MCP (`.mcp.json`): **context7** (live TanStack/Tailwind v4/shadcn/Zod docs — prefer over memory for API syntax), **shadcn** (search/install, pairs with `/add-shadcn`), **chrome-devtools** (QA), **figma** (pull frames/tokens from the UDN Admin Dashboard file `l7izBcDr0PtS2FUdMdHFk3`).
- Design skill: **impeccable** (`.claude/skills/impeccable/`, `/impeccable <craft|polish|audit|…>`; `/impeccable init` first use) — use during builds for craft.
- Prettier devDependency + PostToolUse hook auto-formats every Edit/Write (`.claude/hooks/format.sh`).

## Decisions log (durable facts only)
- Global entities live in `src/types/models/` (migrate from `src/models/`); axios stays in `src/lib/axios.ts`.
- API is separate + not built -> services are mock-backed (fixtures in `features/<f>/data/`) behind a stable interface; swap to real HTTP later per `system_architecture.md §6`.
- Only role = `super-admin` (`["*"]`), but build `<Can>`/`useCan`/`requirePermission` scaffold now.
- Admin is English-only (no i18n); monochrome neutral (not the consumer Neon Violet); Inter for everything.
