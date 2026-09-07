# Feature Isolation (the Golden Rule)

- Everything domain-specific lives under `src/features/<feature>/`. A feature is a self-contained vertical slice: `api`/`services`, `components`, `hooks`, `schemas`, `types`, `data`, `pages`, `layouts` + an `index.ts` barrel.
- **NEVER import one feature's internals into another feature.** No `@/features/transactions/...` inside `@/features/financial/...`.
- If two features need the same thing, it is not feature-specific — promote it: UI → `components/common`, logic → `lib`/`utils`/`hooks`, entities → `types/models`.
- Routes and cross-feature code import a feature ONLY through its `index.ts` barrel, never deep paths.
- `src/routes/` is registry-only, `src/components/ui` is dumb shadcn primitives, `src/features/*` is the app.

**Why this matters here:** MVP has three sibling features (`dashboard`, `financial`, `transactions`) that share the same building blocks — `StatCard`, `TrendPill`, the chart card, the data table. The correct move is to build those generically and promote the shared ones, not to reach across features. QA greps for `from "@/features/` inside `src/features` and fails on any hit.
