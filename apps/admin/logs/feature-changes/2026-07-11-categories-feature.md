# 2026-07-11 — Categories feature (list, Add form, 5-tab routing, preview)

**Scope:** `categories` — new MVP-adjacent feature (`product_requirements.md §4.5`, promoted from roadmap 2026-07-11)
**Type:** feat
**Author/agent:** @frontend + @api (`/build-feature categories`)

## What changed
- New feature slice `src/features/categories/` (types, mock fixtures, service, TanStack Query hooks, Zod schema, components, layouts, pages, tests), following the same shape as `transactions`.
- Five real nested tab routes under `/categories` (`Category` default, `Sub Category`, `Category Type`, `Server Category`, `Supplier Category`) plus `/categories/category/add`, wired via `CategoryTabsLayout` (URL-driven tabs, hidden on the Add sub-route).
- List view: search + "Type Category" filter + refresh + "+ Add Category" toolbar, a trimmed server-mode table (checkbox column, loading/empty/error states, pagination footer — no sort/drag), row menu (Edit + Delete, `<Can>`-gated), and a Switch-based active/inactive status toggle.
- Add Category form: two sections ("Basic information", "Category form") built exactly to the reference — 8 basic-info fields (4 selects, 4 text inputs, slug auto-derived from name on blur but editable), and a dynamic `useFieldArray` field-definition builder with the verbatim field-key guide callout and a reserved-key (`whatsapp`/`email`) Zod validation.
- Unauthenticated dev-only preview at `/categories-preview` and `/categories-preview/add`, reusing the existing `_preview.tsx` pathless layout.
- The "+ Add Category" button and the Add form's Cancel/post-save navigation all derive their target from the current route's pathname (`useLocation`), not a hardcoded absolute path — so they work identically under the real route and the preview route.
- Extended `DashboardNavbar` with a scoped multi-segment breadcrumb ("Category › Category", "Category › Category › Add Category") for `/categories*` and `/categories-preview*` paths only; every other route's single-title breadcrumb is unchanged.
- Repointed the sidebar's pre-existing "Category" nav item from the `/dashboard` placeholder to `/categories`.
- Added a `hasPointerCapture`/`releasePointerCapture`/`scrollIntoView` jsdom shim to the shared `src/test/setup.ts` harness — Radix `Select` needs these once a test actually opens the dropdown and clicks an option, which no prior feature's tests did.

## Why
- §4.5 gives a confirmed reference for only the first `Category` tab (list + Add form); the other four tabs have no reference or entity shape this round, so they render a shared `ProvisionalTabPage` (title + real subcopy + an explicit "provisional" notice) instead of a full list+add build.
- **The reference list table's columns (Header/Section Type/Status/Target/Limit/Reviewer, rows "Cover Page"/"Table of Contents"/"Executive Summary", reviewers "Jamik Tashpulatov"/"Eddie Lake") are the stock shadcn/ui data-table demo dataset, unrelated to top-up categories** — not reproduced. Kept the interaction pattern (checkbox column, status badge/toggle, search+filter toolbar, refresh button, row menu) and designed real columns instead: Category Name, Category Type, Code / Slug, Status, Actions.
- The reference's row menu only showed "Delete" open on a row — **only Delete was visually confirmed**; "Edit" was added because there's no other way to reach the edit form.
- Status is a simple `active`/`inactive` toggle per §4.5, deliberately not a review-workflow state like the reference's "In Process"/"Done" pills.
- The `order_form_fields` concept (buyer-facing input keys shown on the consumer top-up site's order form) has a **direct but not-yet-wired relationship to the consumer storefront** — captured in the data model and the Add-form's field-definition builder, but nothing calls the consumer app yet (UI-first, no backend).
- Both reference pages repeated the same "lorem ipsum dolot sit amet" placeholder subcopy; real, accurate subcopy was written for both the list and Add pages instead.

## Files touched
- `src/features/categories/**` (new: `types/category.type.ts`, `data/categories.data.ts`, `data/select-options.data.ts`, `services/categories.service.ts`, `hooks/useCategories.ts`, `schemas/categoryForm.schema.ts`, `components/*`, `layouts/CategoryTabsLayout.tsx`, `pages/*`, `tests/*`, `index.ts`)
- `src/routes/_protected/categories/route.tsx`, `index.tsx`, `category/index.tsx`, `category/add/index.tsx`, `sub-category/index.tsx`, `category-type/index.tsx`, `server-category/index.tsx`, `supplier-category/index.tsx` (new)
- `src/routes/_preview/categories-preview/index.tsx`, `src/routes/_preview/categories-preview/add/index.tsx` (new)
- `src/routeTree.gen.ts` (regenerated via `vite build`, not hand-edited)
- `src/features/dashboard/components/DashboardSidebar.tsx` (Category href `/dashboard` → `/categories`)
- `src/features/dashboard/components/DashboardNavbar.tsx` (scoped `/categories*` breadcrumb trail, additive)
- `src/test/setup.ts` (jsdom Radix-Select pointer-capture/scrollIntoView shim)

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed failing on missing routes/content), then implemented to green
- [x] `npm run test` passes (117/117 across 20 files)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean for this feature's files (repo carries 8 pre-existing `react-refresh/only-export-components` errors in untouched `src/components/ui/*` shadcn output, confirmed via `git status`, not introduced by this change)
- [x] `/qa-audit` run — findings in `.artifacts/qa-log.md`; the one Medium finding (missing Add-form submit/validation test coverage) was fixed by adding 3 tests (required-field errors, reserved-key block, successful create+navigate) before this log entry
- [x] Renders in **both** light and dark (verified via chrome-devtools screenshots of `/categories-preview` and `/categories-preview/add`)
- [ ] Reconciled against Figma frame — **no Figma node exists for Category** (only Dashboard `22011-2008` is documented in `design_system.md §11`; Figma MCP file access has been denied every prior session, consistent with the `integration` feature's log). Reconciled against the 3 user-supplied reference images instead.

## Notes / follow-ups
- Swap `categoriesService`'s mock bodies for real `api.get/post/put/delete(...)` calls once the backend ships — the interface, hooks, and UI stay unchanged (`system_architecture.md §6`).
- Sub Category / Category Type / Server Category / Supplier Category tabs are provisional stubs (`ProvisionalTabPage`) pending their own reference designs — no entity shape, list, or add form yet.
- `order_form_fields` has no consumer-storefront wiring yet — captured in the data model and the Add-form builder only.
- Considered the newer shadcn `Combobox` primitive for the four "Type to search..." selects (closer visual match to the reference's placeholder) but used the existing, already-proven `Select` pattern instead — zero prior usage precedent for `Combobox` in this repo, and `Select` is what every other feature's forms already use.
