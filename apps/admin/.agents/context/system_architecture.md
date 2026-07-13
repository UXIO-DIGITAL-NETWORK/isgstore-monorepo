# System Architecture & Best Practices Brief: UDN Admin Dashboard

> **Source of truth for _how_ we build.** Highest precedence document. Every agent MUST read this before writing code.
> This brief describes the **actual** boilerplate in this repository — not a generic template.
>
> **Revision (2026-07-09):** added §4.11 Testing Strategy and updated §8/§9 — every feature is now built **TDD-first** (Vitest + React Testing Library). No other section changed.

---

## 1. The Bridge (Frontend ↔ Backend Contract)

- **Topology:** The admin frontend is a standalone React SPA talking to a **dedicated admin backend** (assumed Laravel) that is **separate from the consumer platform**. There is no shared codebase or DB with the consumer app.
- **Backend status:** the API does **not exist yet**. This phase is **UI-first**; the FE is built against typed mock fixtures behind a stable service interface (see §6), so switching to real HTTP is a one-file change per service.
- **Base URL:** read from `import.meta.env.VITE_API_BASE_URL` via `src/config/env.ts` (`ENV.API_BASE_URL`). Current default targets a Laravel dev server (`http://127.0.0.1:8000/api/`).
- **HTTP client:** a single configured Axios instance in `src/lib/axios.ts` (`api`). Its response interceptor **unwraps `response.data`**, so service methods return the API payload directly (not the raw Axios response). Its request interceptor injects `Authorization: Bearer <token>` from `useAuthStore`. On `401` (except from `/login`) it clears auth and hard-redirects to `/login`.
- **Auth:** token-based (Bearer). The token is persisted in a **cookie** (`access_token`) via `js-cookie` in `useAuthStore`. "Remember me" controls cookie expiry (persistent up to 30 days vs. session cookie).

### 1.1 Response envelopes (the two shapes)

**Single resource / action** — the envelope in `src/types/api.type.ts`, confirmed against the real login endpoint's response (2026-07-11) — it also carries a `code`, missed in the original speculative version:

```ts
interface ApiResponse<T> {
  status: "success" | "error";
  code: number;
  message: string;
  data: T;
}
interface ApiError {
  status: string;
  message: string;
  errors: Record<string, string[]>;
}
```

**Paginated list** — until the real API is defined, standardize on the **Laravel paginator** shape. Add to `src/types/api.type.ts`:

```ts
interface PaginatedResponse<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}
```

All server-side tables (transactions, ledger) type their query against `PaginatedResponse<T>` and send `page`, `per_page`, `sort`, `filter[...]`, `search` params.

---

## 2. The Golden Rule of Frontend Architecture

**Feature isolation is absolute.** Business logic is grouped under `src/features/<feature>/`. A feature is a self-contained vertical slice and exposes its public surface through a single `index.ts` barrel.

- **NEVER import from one feature's internals into another feature** (no `@/features/transactions/...` inside `@/features/financial/...`). If two features need the same thing, it is not feature-specific — promote it to a shared location (`src/components/common`, `src/lib`, `src/utils`, `src/types/models`, `src/hooks`).
- Routes and cross-feature code import only from a feature's `index.ts` barrel, never deep paths.
- `src/routes/` is a **registry**, `src/components/ui` is **dumb primitives**, `src/features/*` is **the app**.

---

## 3. Directory Structure (as built + two conventions applied)

This mirrors the real repo. **Two decisions are locked for this project:**

1. **Global entities live in `src/types/models/`** (e.g. `src/types/models/user.model.ts`). Migrate the existing `src/models/` into `src/types/models/` and update imports. Feature-specific types stay in the owning feature's `types/`.
2. **Axios stays in `src/lib/axios.ts`** (do **not** move it to `src/config/`). `src/config/` holds env-driven config only (`env.ts`).

```text
src/
├── assets/                     # Static files (images, icons, fonts)
├── components/
│   ├── ui/                     # shadcn primitives ONLY (button, table, dialog, chart, sidebar, …). No business logic.
│   ├── common/                 # HTML-element replacements — PREFER over raw tags in app code:
│   │   │                       #   Box→div/section, Text→p/span, Heading→h1–h6,
│   │   │                       #   Container→centered max-width, Image→img, Link→a
│   │   └── ThemeToggle.tsx
│   └── layouts/                # Global layout wrappers (RootLayout)
├── config/
│   └── env.ts                  # import.meta.env.VITE_* only
├── constants/                  # App-wide immutable values; feature-specific → features/<f>/constants/
├── features/                   # 📦 THE APP (feature-based, isolated)
│   ├── auth/                   # (built) services, hooks (useLogin/useLogout/useRegister), schemas, types, layouts, pages, components, index.ts
│   ├── dashboard/              # MVP — replace demo widgets with UDN dashboard (see PRD §4.1)
│   ├── financial/              # MVP — new (PRD §4.2)
│   └── transactions/           # MVP — new (PRD §4.3)
│       ├── api/ | services/    # Axios-backed service module (or mock adapter this phase)
│       ├── components/         # feature-local presentational pieces (table, filters, detail panels)
│       ├── hooks/              # TanStack Query hooks + non-API hooks
│       ├── schemas/            # Zod runtime schemas (filters, action forms)
│       ├── types/              # feature-specific TS types (often z.infer<…>)
│       ├── data/               # typed mock fixtures for UI-first phase
│       ├── pages/              # "smart" components (fetch + compose)
│       └── index.ts            # barrel (public surface)
├── hooks/                      # Global hooks (useMobile, useTheme, …)
├── lib/
│   ├── axios.ts                # configured `api` instance + interceptors  (STAYS HERE)
│   ├── react-query.ts          # QueryClient config
│   └── utils.ts                # cn() (clsx + tailwind-merge)
├── middlewares/
│   └── authMiddleware.ts       # requireAuth(), requireGuest(), requirePermission()
├── providers/                  # ThemeProvider (next-themes), etc.
├── routes/                     # 📍 REGISTRY ONLY — path → component + beforeLoad guard. No JSX, no logic.
│   ├── __root.tsx
│   ├── index.tsx               # '/'
│   ├── _auth/                  # guest-only group (requireGuest) → AuthLayout
│   └── _protected/             # authenticated group (requireAuth) → DashboardLayout
├── store/                      # 🧠 Zustand global client state
│   └── useAuthStore.ts         # token (cookie), roles, permissions
├── types/
│   ├── api.type.ts             # ApiResponse<T>, ApiError, PaginatedResponse<T>
│   └── models/                 # 👈 global entities (user.model.ts, transaction.model.ts, …)
├── utils/                      # pure helpers (formatCurrency, formatDate, …)
├── index.css                   # Tailwind v4 @theme tokens (design_system.md §9)
├── main.tsx                    # provider stack bootstrap
└── routeTree.gen.ts            # 🤖 auto-generated by @tanstack/router-plugin — NEVER hand-edit
```

---

## 4. Frontend Best Practices (Strict)

### 4.1 Routing is a registry, not a UI layer

- Files in `src/routes/` only wire a `path` → a `component` import (from a feature barrel) → a `beforeLoad` guard. **No JSX, no inline auth/validation logic.**
- Use TanStack Router's underscore-prefix pathless layout routes: `_auth` (guest-only, wraps `AuthLayout`), `_protected` (authenticated, wraps `DashboardLayout`).
- `routeTree.gen.ts` is generated by the Vite `@tanstack/router-plugin` — never edit it.

### 4.2 Guards live in middleware, called from `beforeLoad`

- `src/middlewares/authMiddleware.ts` exports `requireAuth()`, `requireGuest()`, and (new) `requirePermission(permission)`. They read `useAuthStore.getState()` and `throw redirect(...)`. Example:

```tsx
// src/routes/_protected/transactions/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/features/transactions";
import { requirePermission } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/_protected/transactions/")({
  beforeLoad: () => requirePermission("transactions.view"),
  component: TransactionsPage,
});
```

### 4.3 State split (never blur these)

- **Server/API data → TanStack Query only.** Never store fetch results permanently in Zustand or `useState`. Query owns caching, sync, loading/error.
- **Global client/UI state → Zustand** in `src/store/` (auth token/roles/permissions, theme). No API fetching here.
- **Local state → `useState`** for single-component concerns.
- `useAuthStore` persists the token to the `access_token` cookie; `setToken(token, remember)` sets expiry (persistent vs. session).

### 4.4 API layer pattern (services → hooks)

- Each feature has a **service module** (`api/` or `services/`) that calls the shared `api` instance and returns **strictly typed** data (using `ApiResponse<T>` / `PaginatedResponse<T>`).
- Consume services via **TanStack Query hooks** in the feature's `hooks/`. Mutation pattern (see `features/auth/hooks/useLogin.ts`): `mutation → update Zustand store → navigate`.
- Never call `api` directly from a component; always via a service + hook.

### 4.5 Forms

- All forms use **React Hook Form + Zod** via `@hookform/resolvers/zod`. No manual validation in JSX.
- **Zod schemas → `features/<f>/schemas/`**; **static TS types → `features/<f>/types/`** (often `z.infer<typeof schema>`). Use shadcn `Field`/`Form` primitives for markup.

### 4.6 Component hierarchy

- `components/ui/` — shadcn primitives only (add via the shadcn CLI / shadcn MCP, don't hand-write).
- `components/common/` — `Box`/`Text`/`Heading`/`Container`/`Image`/`Link`. **Prefer these over raw `div`/`p`/`span`/`img`/`a`** in app code.
- `components/layouts/` — global wrappers (`RootLayout`).
- Feature-local UI → `features/<f>/components/`. "Smart" pages → `features/<f>/pages/`.
- Use `cn()` from `src/lib/utils.ts` for conditional classes; use `cva` for polymorphic/variant components (avoid class collisions).

### 4.7 Styling & typing hygiene

- **No raw hex** anywhere in app code — use design tokens (`bg-background`, `text-foreground`, `border-border`, `text-success`, …). See `design_system.md`.
- **No `any`.** Infer from Zod or declare explicit types.
- Numeric/tabular values use Inter with `tabular-nums`; money via the shared `formatCurrency` util.

### 4.8 Data tables (the workhorse)

- Built on **TanStack Table (`@tanstack/react-table`) in manual/server mode** + shadcn `table`.
- Pagination, sorting, and filtering are **server-driven**: table state → query params → API → `PaginatedResponse<T>`. Do not client-paginate large lists.
- Provide explicit **loading (skeleton), empty, and error** states for every table.

### 4.9 Uploads & real-time

- **Uploads:** multipart `FormData` to the backend through a shared helper (no S3 this phase).
- **Real-time:** TanStack Query **polling** (`refetchInterval`) where freshness matters (e.g. transaction status); stop polling on terminal states. No websockets/Echo this phase.

### 4.10 Config vs constants

- `src/config/env.ts` — env-driven values (`VITE_*`).
- `src/constants/` — app-wide hardcoded immutables (pagination sizes, regex, enum arrays); feature-specific → `features/<f>/constants/`.

### 4.11 Testing strategy — TDD (mandatory)

Every feature/screen is built **test-first**: write the test cases, write the failing tests, then implement until green. Applies to `@frontend` (pages/components) and `@api` (services/hooks) alike.

- **Stack:** Vitest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) on `jsdom`. Config in `vitest.config.ts`, kept separate from `vite.config.ts` (just the `react()` plugin + the same `@` alias + `test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"] }`). No `globals: true` — tests import `describe`/`it`/`expect` from `"vitest"` explicitly, so no `tsconfig` changes are needed.
- **Colocated tests:** `Thing.tsx` + `Thing.test.tsx` in the same folder — keeps tests inside the feature boundary (§2).
- **Shared harness in `src/test/`:**
  - `setup.ts` — extends `expect` via `@testing-library/jest-dom`; stubs `window.matchMedia` (`next-themes`' `ThemeProvider` calls it; `jsdom` doesn't implement it).
  - `test-utils.tsx` — a `renderRoute(initialPath)` helper: builds a **real** router from `routeTree.gen.ts` + `createMemoryHistory`, wraps it in a fresh `QueryClientProvider` (`retry: false` on queries/mutations) and the app's `ThemeProvider`, awaits the router being ready. This exercises actual route resolution and guards, not a shallow stand-in — reuse it for every feature rather than hand-rolling a new wrapper. Router/Query testing APIs move fast; verify current syntax via the context7 MCP rather than assuming.
- **The loop, per feature (inside `/build-feature`):**
  1. Define test cases in plain language, grounded in the PRD spec for that screen: what must be reachable, what content/labels must exist, what interactions must work.
  2. Write those as failing tests; confirm they fail for the **right** reason (missing content/behavior, not a setup crash).
  3. Implement until every case is green.
  4. Never loosen or delete a test to make it pass — if a test is wrong against the spec, fix the test and say so.
- **Scope:** every new page/screen gets a reachability + content test at minimum; every service/hook gets a test asserting its typed contract/shape; every form gets a validation-behavior test (empty submit surfaces errors; valid submit calls the mutation). Don't assert exact className/token strings in tests — that's `/qa-audit`'s grep gate. Charts/animation are smoke-tested only (renders without crashing, key labels present) — deep visual assertions are brittle and low-value; this is a narrow, deliberate exception, not a loophole.
- **Scripts:** `npm run test` (single run) / `npm run test:watch` (dev loop) — add both to `package.json` the first time the harness is set up.

### 4.12 Error & not-found pages

`src/routes/__root.tsx` currently has no `notFoundComponent`/`errorComponent` at all — this is greenfield. Build one shared status-page component used by both:

- **Not Found (404):** the router's not-found mechanism (config surface for this version, `^1.162.8`, should be verified via the context7 MCP rather than assumed — it's evolved across releases).
- **Error boundary (used for a "503 Server Error" presentation):** the router's error-boundary mechanism, same verification note.

Both render **full-screen, outside `DashboardLayout`** (no sidebar/topbar) — these are boundary states, not authenticated screens, and aren't gated by auth (a person can hit a bad URL or an error whether logged in or not). The "back to home" action should route to `/dashboard` if a token exists, `/` otherwise.

---

## 5. Authorization Architecture (RBAC scaffold)

Only **`super-admin`** exists in MVP and holds **all permissions**, but the plumbing is built for multi-role from day one.

> **Revision (2026-07-11):** the real login response returns a single `role_id: number` on the user object, not the `roles: string[]` / `permissions: string[]` arrays originally speculated here. The `<Can>`/`useCan`/`requirePermission` interface below is unaffected — it's still the right frontend abstraction — but **something has to derive `permissions: string[]` from `role_id` client-side** until either a dedicated permissions endpoint exists or the backend documents a full role→permission map. For now: a small hardcoded map (`role_id === 1 → ["*"]`, everything else → `[]`) is the pragmatic stopgap, since only `super-admin` (`role_id: 1`) is confirmed to exist right now anyway. Treat any other `role_id` as unmapped/no-permissions until confirmed, don't guess at what it means.

- **Store:** `useAuthStore` holds the access token, a `refreshToken`, the authenticated `user` (see `product_requirements.md §6`), and a derived `permissions: string[]` (via the stopgap map above, hydrated after login).
- **Route gate:** `requirePermission(permission)` in `beforeLoad` (throws `redirect` to a safe route if missing). `super-admin` short-circuits to allowed.
- **UI gate:** a `<Can permission="transactions.refund">…</Can>` component and a `useCan(permission): boolean` hook for conditionally rendering actions/menu items.
- **Convention:** permission strings are `resource.action` (e.g. `transactions.view`, `transactions.refund`, `financial.export`). Wildcards (`*`) grant all — Super Admin gets `["*"]`.

---

## 6. UI-First Strategy (API not built yet)

The switch from mock → real API must cost one edit per service. Pattern:

- Each feature service exposes a **typed interface** the hooks depend on (e.g. `transactionsService.list(params): Promise<PaginatedResponse<Transaction>>`).
- **This phase:** the service returns data from **typed mock fixtures** in `features/<f>/data/` (optionally with a small artificial delay). TanStack Query hooks, components, and types are written as if the data were real.
- **Later:** replace the mock body with the real `api.get/post(...)` call. The interface, hooks, and UI stay untouched.
- Keep an `ENV`/flag seam (e.g. `ENV.USE_MOCKS`) if you want mock/real toggling, but the interface boundary is what guarantees a clean swap.

> Agents MUST NOT scatter mock data inside components. Mocks belong in `data/` behind the service boundary.

---

## 7. Provider Stack (Application Bootstrap)

`src/main.tsx` composes providers in this order (outermost → innermost):

1. `QueryClientProvider` (client from `src/lib/react-query.ts`)
2. `ThemeProvider` (`next-themes`; `attribute="class"`, `defaultTheme="dark"`, dark is default, light available)
3. `RouterProvider` (TanStack Router; router built from `routeTree.gen.ts`)
4. `Toaster` (`sonner`) mounted for global toasts
5. Dev-only: React Query Devtools + Router Devtools

`__root.tsx` renders the shell/outlet; it does not own business logic.

---

## 8. Environments & Build

- `npm run dev` (Vite), `npm run build` (`tsc -b` then Vite build), `npm run lint` (ESLint), `npm run preview`.
- `npm run test` (Vitest, single run) / `npm run test:watch` (Vitest, watch mode) — see §4.11. Set up on first use if not already present; every feature after reuses the same harness.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`, and mirrored in `vitest.config.ts`). TypeScript strict mode is on.

---

## 9. Definition of Done (per feature/page)

A page/feature is "done" only when **all** hold:

- [ ] Reads all three context docs first; matches PRD scope for that screen.
- [ ] Built TDD-first: test cases defined, failing tests written, then implemented to green (§4.11) — `npm run test` passes.
- [ ] Feature is isolated — **zero cross-feature imports**; public surface via `index.ts` barrel.
- [ ] Routes are registry-only; guards (`requireAuth`/`requirePermission`) live in `beforeLoad`, not components.
- [ ] Server state via TanStack Query; global client state via Zustand; no server data in `useState`/Zustand.
- [ ] API access via a typed service + query/mutation hook (mock-backed this phase, swappable to real).
- [ ] Tables are server-side-ready (params → `PaginatedResponse<T>`) with loading/empty/error states.
- [ ] Forms use RHF + Zod resolver; schemas in `schemas/`, types in `types/`.
- [ ] UI uses `components/common` wrappers + shadcn primitives; `cn()`/`cva`; **no raw hex**, tokens only.
- [ ] Renders correctly in **both light and dark**; monochrome fidelity to Figma; Inter + `tabular-nums` for numbers.
- [ ] **Zero** TypeScript errors, **zero** ESLint errors, **no** `any`.
- [ ] Destructive actions have confirmation + toast feedback; permission-gated via `<Can>`.
