# Frontend Engineer — Project Memory

> **STATUS:** `auth` and `dashboard` are real features (dashboard rebuilt 2026-07-10, template widgets gone). MVP = **Dashboard -> Financial -> Transaction**, built one approval gate at a time; `financial`/`transactions` not started (routes don't exist yet — only `/`, `/login`, `/dashboard` are registered). Backend is separate and **not built yet** — screens are backed by typed mock fixtures (coordinate with @api). `src/index.css` has been retuned to true-neutral (`--success`, `--chart-1/2` exist) — do not touch it without checking first.

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
- **No barrel in `components/common`** — import each file directly, e.g. `import { Box } from "@/components/common/Box"`, `import { Link } from "@/components/common/Link"`. (The `import { Box, Heading, Text } from "@/components/common"` shorthand shown below and in CLAUDE.md does **not** resolve — always use the per-file path.)
- `Link`'s internal `RouterLink` gets `to={href as unknown as string}` — it bypasses TanStack Router's strict route-literal typing on purpose. Use `<Link href="/financial">` (not raw `<Link to="/financial">` from `@tanstack/react-router`) for any nav item whose route isn't registered yet in `routeTree.gen.ts` (e.g. sidebar items for MVP features not yet built) — raw `Link`/`useNavigate` will fail `tsc` on unregistered paths. For `useNavigate` calls to a dynamic/not-yet-registered path, cast the same way: `navigate({ to: href as unknown as string })`.

## Actually-registered routes (check before adding nav links)
Only `/`, `/login`, `/dashboard` exist in `src/routeTree.gen.ts` as of 2026-07-10. `/financial` and `/transactions` are referenced by the dashboard sidebar (via the `href`-cast trick above) but have no route yet — don't add real TanStack `Link to="..."` for them until those features land.

## Shared workhorses (built for Dashboard 2026-07-10 — currently feature-local in `features/dashboard/components/`, NOT yet promoted to `components/common`; promote on second consumer, don't duplicate)
- `StatCard` — takes one `StatCardData`; label + `TrendPill` (top-right) + big value (`formatCurrency`, `text-3xl font-semibold tabular-nums`) + caption. `bg-card border border-border rounded-xl p-4`.
- `TrendPill` — `cva` variants `up` (`bg-success/10 text-success` + `ArrowUpRight`) / `down` (`bg-destructive/10 text-destructive` + `ArrowDownRight`); `rounded-full px-2 py-0.5 text-xs font-medium tabular-nums`. Sign (`+`/`-`) follows the `direction` prop, not the raw `deltaPct` sign (fixture values are always positive).
- `PerformanceChartCard` — self-contained (owns its own `month` state + `useChartSeries(month)` call, no props). recharts `AreaChart` via shadcn `chart` (`ChartContainer`/`ChartTooltip`/`ChartTooltipContent`, `ChartConfig` colors as `"var(--chart-1)"` / `"var(--chart-2)"`, `Area fill/stroke="var(--color-<key>)"`). X-axis label pre-formatted with `date-fns` `format(date, "MMM d")`. Manual legend below (colored dot `Box` + `Text`) rather than `ChartLegendContent` (simpler, matches spec exactly). **Wrap the root in `<Box as="section" aria-label="Monthly Performance">`** — needed so tests (and any future page with >1 `Select`/combobox) can scope queries via `getByRole("region", {name})` instead of guessing DOM structure or querying by className (className queries are banned by the testing rule).
- `PendingOrdersCard` / `ActivityFeedCard` — self-contained (own their `usePendingOrders()`/`useActivityLog()` calls), `bg-card border border-border rounded-xl p-4`, header row = `Heading` + decorative "Show More" `Button variant="link"`. `PendingOrders` fixture keys are camelCase (`manualOrders`/`pendingPayment`/`processing`/`failedTransaction`) — map to human labels ("Manual Orders" etc.) in the component, fixture keys are never rendered raw.
- `DataTable<TData>` — **client-mode** `@tanstack/react-table` (`getCoreRowModel` only, no pagination) + shadcn `table`. Props: `columns`, `data`, `isLoading`, `isError`, `onRetry`, `emptyMessage`. Loading -> skeleton rows sized to `columns.length`; error -> inline message + retry `Button`; empty -> single-row message. Right-aligns every column after the first via index check (`index > 0`), not a `meta` flag (avoids TanStack `ColumnMeta` generic augmentation for a single consumer). Triggers a React Compiler warning ("Compilation Skipped: incompatible library") on `useReactTable()` — expected/unavoidable with this API, not a lint error, don't try to fix it. **This is intentionally feature-local and client-mode** (explicit instruction) — Transactions' future server-paginated table is a different/evolved component, don't assume this one already covers it when that feature is built.

## Testing (TDD, mandatory — set up on first use)
Vitest + React Testing Library on `jsdom`, config in `vitest.config.ts` (separate from `vite.config.ts`; no `globals: true`). Harness lives in `src/test/`: `setup.ts` (jest-dom matchers + a `window.matchMedia` stub, `next-themes`' `ThemeProvider` needs it and jsdom doesn't implement it) and `test-utils.tsx` (`renderRoute(initialPath)` — real router from `routeTree.gen.ts` + `createMemoryHistory`, fresh `QueryClientProvider` with `retry: false`, wrapped in `ThemeProvider`). Tests are colocated (`Thing.tsx` + `Thing.test.tsx`). Build every page/component test-first: define cases in plain language against the PRD spec, write failing tests, implement to green. Test accessible content/behavior (`getByRole`/`getByLabelText`), never className/token strings — that's `/qa-audit`'s job. Charts/animation are smoke-tested only. Scripts: `npm run test` / `npm run test:watch`.
- **Testing a route behind `requireAuth`**: seed `useAuthStore.setState({ token: "test-token" })` in `beforeEach` (and reset to `null` in `afterEach`) before `renderRoute(path)` — it's a real Zustand singleton read synchronously by `beforeLoad`, no mocking needed. Pattern proven on `DashboardPage.test.tsx`.
- **Query-loaded content needs `find*`, not `get*`**: `renderRoute`'s `await router.load()` only waits for the route to resolve, not for a component's own `useQuery` calls (even mock-backed ones resolve on a microtask after that). Any assertion on content that comes from a hook like `useOperator()`/`useStatCards()` must use `await screen.findByRole(...)`/`findByText(...)`, or it flakes/fails depending on timing. `getByRole` is fine for content that's present on first synchronous render (static labels, headings that don't depend on query data).
- **Never scope a query by className** (even to disambiguate — e.g. "the combobox inside this specific card" when there are 2 on the page). Add a real accessible landmark instead (`<Box as="section" aria-label="...">` -> `screen.getByRole("region", { name: "..." })`) and scope with `within()`. Cheaper than it sounds and is itself an a11y win.

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
