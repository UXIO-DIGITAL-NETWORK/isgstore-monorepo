# Feature isolation (always on) — mirrors `.agents/rules/feature-isolation`

- Everything domain-specific under `src/features/<f>/`, exposed via `index.ts`. **No cross-feature imports** — no `@/features/<other>/...` from inside another feature.
- Shared code is promoted up: UI -> `components/common`, logic -> `lib`/`utils`/`hooks`, entities -> `types/models`.
- Routes/cross-feature code import a feature only through its `index.ts` barrel.
- Enforcement grep: `grep -rn 'from "@/features/" src/features` must be empty.

**Why this matters here:** the MVP is three sibling features (`dashboard`, `financial`, `transactions`) sharing `StatCard`/`TrendPill`/`PerformanceChartCard`/`DataTable` — build those generically and promote the shared ones; don't reach across features.
