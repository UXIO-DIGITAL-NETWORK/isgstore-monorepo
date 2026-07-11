# 2026-07-11 — Categories: preview tabs parity + Category form polish

**Scope:** `categories` — follow-up UI fixes to the feature shipped earlier the same day
**Type:** fix
**Author/agent:** @frontend

## What changed
- The 5-tab bar (`CategoryTabsLayout`) now renders under the unauthenticated preview route too, not just the real authenticated route. Tab hrefs are derived from whichever base the current pathname is under (`/categories` vs `/categories-preview`), so clicking a sibling tab from preview never leaks out into the real, auth-guarded route.
- Restructured `src/routes/_preview/categories-preview/**` to mirror the real nested shape 1:1: `/categories-preview` now redirects to `/categories-preview/category` (was the list page directly), the Add form moved from `/categories-preview/add` to `/categories-preview/category/add`, and the 4 provisional tabs got their own preview routes.
- Fixed a real bug in `DashboardNavbar.tsx`'s `getCategoryBreadcrumb()`: it checked `pathname.startsWith("/categories")` before checking `"/categories-preview"`, but the former is a substring match of the latter, so preview paths always resolved to the wrong (real) base. Preview breadcrumbs were computing garbage segments as a result. Preview base is now checked first.
- `CategoryFormFieldsBuilder`'s "Field key guide" callout is now styled with the `--warning` token (`text-warning`/`border-warning`), matching the `Alert` `destructive` variant's override-at-call-site pattern rather than a new shared variant.
- Moved the "+ Add Form" button from below the row list to directly under the guide callout (right-aligned).
- The empty state ("No forms yet...") is now a bordered box with the message centered inside, instead of bare centered text.

## Why
- User-supplied reference images showed tabs above the page title/breadcrumb, and a warning-colored guide with the Add Form button repositioned and a boxed empty state — direct visual corrections against the reference, not a reinterpretation.
- Tabs only existed on the real route because the original preview build deliberately mirrored the flat, no-layout preview pattern used by every prior feature (`transaction-preview`, `finance-preview`, etc.) — none of those have nested sub-routes, so there was nothing to mirror. Categories is the first feature with real nested tab routes, so it needed its own preview parity rather than reusing the flat precedent blindly.

## Files touched
- `src/features/categories/layouts/CategoryTabsLayout.tsx` (base-relative tab hrefs)
- `src/features/categories/components/CategoryFormFieldsBuilder.tsx` (warning styling, button reposition, boxed empty state)
- `src/features/dashboard/components/DashboardNavbar.tsx` (preview-base-first breadcrumb fix)
- `src/routes/_preview/categories-preview/route.tsx` (new layout route, `CategoryTabsLayout`)
- `src/routes/_preview/categories-preview/index.tsx` (now a redirect, was the list page)
- `src/routes/_preview/categories-preview/category/index.tsx` (new — list, moved here)
- `src/routes/_preview/categories-preview/category/add/index.tsx` (new — Add form, moved from `add/index.tsx`)
- `src/routes/_preview/categories-preview/{sub-category,category-type,server-category,supplier-category}/index.tsx` (new — provisional tab parity)
- `src/routes/_preview/categories-preview/add/index.tsx` (deleted)
- `src/routeTree.gen.ts` (regenerated via `vite build`, not hand-edited)
- `src/features/categories/tests/CategoryListPage.test.tsx`, `src/features/categories/tests/AddCategoryPage.test.tsx` (updated preview URLs, added a tabs-in-preview test)

## Verification
- [x] Built TDD-first: existing tests updated to the new URLs first, confirmed they'd fail against the old routes' shape, then implemented the restructure to green (plus one new test for tab-href safety in preview)
- [x] `npm run test` passes (118/118)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (same 8 pre-existing errors in untouched files as before)
- [ ] `/qa-audit` — not re-run for this small follow-up; grepped manually for raw hex/palette-class regressions (clean)
- [x] Renders in **both** light and dark (verified via chrome-devtools screenshots of `/categories-preview/category` and `/categories-preview/category/add`, both themes)
- [ ] Reconciled against Figma frame — still no Figma node for Category; reconciled against the 2 new user-supplied reference images instead

## Notes / follow-ups
- The 4 provisional tabs now have preview routes but still render the same placeholder `ProvisionalTabPage` — no new content, just routing parity.
