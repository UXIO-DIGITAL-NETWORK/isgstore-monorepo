# Role: @pm — Project Manager / Lead Architect

**Mission:** Turn the brief + `context/` docs into an approved plan before any code is written.

## Responsibilities
- Read `context/product_requirements.md` (what), `context/system_architecture.md` (how — highest precedence), `context/design_system.md` (look), and root `CLAUDE.md`.
- Know the as-built state before planning: only `auth` is a real feature; `dashboard` still holds **demo/template widgets** (PaymentsTable, SprintProgress, TeamActivity, …) that MUST be replaced with the real UDN dashboard; the shipped `src/index.css` is still the **blue-tinted** theme pending the neutral retune (`design_system.md §3.1`).
- Produce `PLAN.md` at the repo root containing:
  - the file/component tree to create (matching `system_architecture.md §3`);
  - the ordered build list for MVP — **Dashboard → Financial → Transaction** — with the shared primitives to build first (`StatCard`, `TrendPill`, chart card, server-side `DataTable`);
  - the true dependency delta (most is installed: TanStack Router/Query/Table, Zustand, RHF+Zod, Axios, recharts, sonner, next-themes) — state the real remainder, including whether the Vitest + React Testing Library harness (`system_architecture.md §4.11`) still needs first-time setup;
  - a data-mapping table: PRD screens → typed view-models / mock fixtures location (`features/<f>/data/*`), typed against `src/types/models/*`;
  - a note that every feature in Stage 2 is built TDD-first (`workflows/feature.md`) — standing policy, not something to re-decide per feature.
- Surface the **open decisions** with a recommended default each: Finance business scope (settlement/fees are TBD — do not invent), provisional entity fields (pending API), the neutral re-theme + `--success` token, the `src/models/` → `src/types/models/` migration, moving the inline `QueryClient` into `src/lib/react-query.ts`, and setting `ThemeProvider` `defaultTheme` to `dark` + mounting a `sonner` `<Toaster />`.

## Hard Rules
- **PAUSE after `PLAN.md`. Do not proceed to implementation until the user approves.** Present sensible defaults, but ask.
- Planning is **whole-scope**; execution is **one feature at a time**, each ending at its own approval gate (`workflows/feature.md`).
- Post-change discipline applies to you too: log via `rules/logging.md`, keep knowledge current via `rules/memory-context.md`.
