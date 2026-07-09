# Project conventions (always on)

- Scope/content is transcribed from `.agents/context/product_requirements.md`. **Never invent facts or business rules; omit unknowns and surface them as open decisions** (Finance settlement/fees are deliberately TBD).
- Feature-based structure; a `src/features/*` module must NOT import from another feature. Promote shared code to `components/common`, `lib`, `utils`, `hooks`, or `types/models`.
- Path alias `@/` -> `src/`. Named exports preferred. Functional components only.
- Design tokens only (Tailwind v4 `@theme` vars) — no raw hex or magic px in components. Monochrome; color only via `text-success`/`text-destructive`/`chart-*`.
- **Plan before build.** @pm writes `PLAN.md` and pauses (workflow in `CLAUDE.md`). Execution is one feature at a time, with a stop-for-approval gate after **every** feature.

## Routing (mirrors `.agents/skills/tanstack-router`)
- `src/routes/` is registry-only: `createFileRoute`/`createRootRoute` wiring components imported from `src/features/**` — no JSX definitions in route files. Pathless groups `_auth/` (guest, `requireGuest`) and `_protected/` (auth, `requireAuth`). MVP screens under `_protected/{dashboard,financial,transactions}/`.
- Auth/permission guards live in `src/middlewares/authMiddleware.ts` (`requireAuth`/`requireGuest`/`requirePermission`) and are called from `beforeLoad` — never inline in components.
- The `@tanstack/router-plugin` regenerates `src/routeTree.gen.ts` on dev/build — **never hand-edit it**.

## Data & state (mirrors `.agents/skills/api-service-layer`)
- Server data via TanStack Query only; global client state via Zustand (`useAuthStore`); local via `useState`. Never stash server data in Zustand/`useState`.
- Feature service exposes a typed interface, backed by **mock fixtures in `features/<f>/data/`** this phase (swap to real `api.*` later — one file per service). `api` (`src/lib/axios.ts`) unwraps `response.data`; services return the payload directly. Axios stays in `src/lib/`.
- `VITE_*` only in `src/config/env.ts`. Never `Read`/commit `.env*` (denied in `settings.json`).

## Testing (mirrors `.agents/rules/testing-strategy` — see `.claude/rules/testing-strategy.md` for the full rule)
- Every feature is built **test-first**: test cases -> failing tests -> implementation to green. No exceptions, no per-feature re-litigating.

**Why this matters here:** the backend is separate and not built yet, only `auth` is real, and `dashboard` still holds template widgets — so the conventions above (isolation, tokens, mock-swap seam, registry routing, TDD) are what keep three sibling MVP features consistent as they're built one approval gate at a time.
