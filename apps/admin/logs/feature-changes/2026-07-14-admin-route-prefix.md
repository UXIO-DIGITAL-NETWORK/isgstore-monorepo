# 2026-07-14 — Prefix admin feature routes with `/admin`

**Scope:** setup — routing (`_protected`, `_preview` route groups)
**Type:** refactor
**Author/agent:** you (main)

## What changed
- Moved `src/routes/_protected.tsx` + `src/routes/_protected/**` → `src/routes/admin/_protected.tsx` +
  `src/routes/admin/_protected/**` (`git mv`, structure unchanged, one level deeper). Covers
  dashboard, financial, integration, transactions (route/index/automatic/manual), and categories
  (route/index/category/category/add/category-type/server-category/sub-category/supplier-category).
- Moved `src/routes/_preview.tsx` + `src/routes/_preview/**` → `src/routes/admin/_preview.tsx` +
  `src/routes/admin/_preview/**` the same way — dashboard-preview, finance-preview,
  integration-preview, transaction-preview, categories-preview (+ its own 6 sub-routes).
- Moved `src/routes/error-preview.tsx` → `src/routes/admin/error-preview.tsx`. This one is a
  root-level flat route, not physically under `_preview/`, but is grouped with the previews under
  `/admin` per explicit decision during planning (it's a preview/dev-only route in spirit).
- **Deliberately left unprefixed, not overlooked:** `src/routes/_auth/**` (`/login`) and
  `src/routes/index.tsx` (`/`) — these are entry points, not admin features, per
  `system_architecture.md §4.1`.
- Ran `vite build` to regenerate `src/routeTree.gen.ts` and let `@tanstack/router-plugin`
  auto-sync every moved file's `createFileRoute("…")` path-string argument to its new location
  (no hand-editing of the generated tree or those strings was needed/done).
- Fixed every hardcoded reference to a moved route so the build stays green and nothing silently
  mis-navigates (scope confirmed with the user beyond the original 4-target list, since exploration
  found more breakage than that):
  - **Type-checked (would fail `tsc` otherwise):** the two in-route default redirects
    (`admin/_protected/transactions/index.tsx`, `admin/_protected/categories/index.tsx`) and the
    preview one (`admin/_preview/categories-preview/index.tsx`); `requireGuest`/`requirePermission`
    fallback in `authMiddleware.ts`; `useLogin.ts`'s post-login `navigate`; `HomePage.tsx`'s
    Dashboard `<Link to>`.
  - **Silent (pass `tsc`/lint, wrong at runtime otherwise):** `StatusPage.tsx`'s authenticated
    `homeHref`; every `DashboardSidebar.tsx` nav `href` (incl. `disabled` placeholders);
    `DashboardNavbar.tsx`'s breadcrumb-base and `PAGE_TITLES` string matching (preview-base-first
    order preserved); `TransactionsLayout.tsx` and `CategoryTabsLayout.tsx` tab hrefs/bases (+ a
    stale doc-comment in the latter).
  - **Left alone, confirmed correct as-is:** `requireAuth()` → `/login`; the axios 401 interceptor's
    `window.location.replace("/login")`; `StatusPage.tsx`'s unauthenticated `homeHref` (`/`);
    `AuthSideHero.tsx`'s `/`; the pathname-derived relative nav in `CategoryToolbar.tsx`/
    `AddCategoryPage.tsx` (self-adjusts under `/admin`, untouched by design).
- Updated every `renderRoute(...)` call and navigation-target assertion in the 11 test files that
  exercised a moved path, including two the plan's literal instructions didn't call out but its
  broader intent covered: `useLogin.test.tsx`'s post-login `pathname` assertion, and
  `StatusPage.test.tsx`'s authenticated "back to home" `href` assertion. `LoginPage.test.tsx` and
  the `/`-adjacent assertions needed no change.

## Why
- `system_architecture.md §4.1` (corrected 2026-07-11) mandates physically moving the route groups
  under `src/routes/admin/`, not a router-wide `basepath` — a `basepath` would prefix `/login` too,
  which must stay bare.
- User confirmed (via question during planning) that the fix scope should cover every reference to
  a moved route, not just the 4 originally named — exploration had surfaced additional
  type-checked and silently-breaking references beyond that list.
- User confirmed `error-preview` (a root-level route, not literally under `_preview/`) should move
  to `/admin/error-preview`, grouping it with the other preview/dev routes by intent rather than by
  its literal pre-move file location.

## Files touched
- Moves (30 files, `git mv`): `src/routes/{_protected.tsx,_protected/**,_preview.tsx,_preview/**,error-preview.tsx}`
  → `src/routes/admin/…`
- `src/routeTree.gen.ts` (regenerated, not hand-edited)
- `src/middlewares/authMiddleware.ts`, `src/features/auth/hooks/useLogin.ts`,
  `src/components/common/StatusPage.tsx`,
  `src/features/dashboard/components/{DashboardSidebar,DashboardNavbar}.tsx`,
  `src/features/transactions/layouts/TransactionsLayout.tsx`,
  `src/features/categories/layouts/CategoryTabsLayout.tsx`, `src/features/home/pages/HomePage.tsx`
- The 3 in-route redirect files (`admin/_protected/transactions/index.tsx`,
  `admin/_protected/categories/index.tsx`, `admin/_preview/categories-preview/index.tsx`)
- 11 `*.test.tsx` files: `StatusPage`, `useLogin`, `CategoryListPage`, `AddCategoryPage`,
  `category-routes`, `DashboardNavbar`, `DashboardPage`, `FinancialPage`, `IntegrationPage`,
  `AutomaticTransactionsPage`, `transactions-routes`

## Verification
- [x] Behavior-preserving refactor — no new test-first cycle; existing suite is the safety net
- [x] `npm run test` — 132/132 passed (25 files)
- [x] `npx tsc -b --force` — clean (note: `tsc --noEmit` against the root tsconfig checks 0 files
  here; `-b --force` is the real gate, also what `npm run build` runs)
- [x] `npm run lint` — 0 errors (5 pre-existing React Compiler warnings in unrelated files)
- [x] `npm run build` (`tsc -b && vite build`) — clean end-to-end
- [x] Regenerated `routeTree.gen.ts` inspected directly: every real leaf resolves at
  `/admin/dashboard`, `/admin/financial`, `/admin/integration`, `/admin/transactions/{automatic,manual}`,
  `/admin/categories/category(+/add)`, all 5 category tabs, all 5 `-preview` routes, and
  `/admin/error-preview`; `/login` and `/` still resolve unprefixed; a grep for the old bare paths
  in the generated tree returns nothing (they 404)
- [x] Flow sanity via the passing suite: `category-routes.test.tsx`/`transactions-routes.test.tsx`
  confirm an unauthenticated hit on a protected admin route redirects to `/login` (not
  `/admin/login`); `useLogin.test.tsx` confirms a successful login lands on `/admin/dashboard`

## Notes / follow-ups
- None deferred — this was a scoped, mechanical move-and-repoint with no open questions left.
