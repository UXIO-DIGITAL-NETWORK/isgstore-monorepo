# 2026-07-28 — Category Provider tab (completes all five tabs of `categories`)

**Scope:** `features/categories` — Category Provider tab
**Type:** feat
**Author/agent:** you

## What changed

The fifth and last tab graduated off `ProvisionalTabPage`. **The `categories` feature is now complete** — all five tabs are real.

### Data layer (§4.5 lines 239-251, §6 line 286)

- **`CategoryProvider`** — `id`, `provider_name`, `category_id`, `provider_template`, timestamps. **No `status` field** (see the deactivation note below); the contract test asserts its absence explicitly, the same guard Category Server carries.
- 5 deterministic fixtures, a mock-backed service (`list/getById/create/update/remove`, no `setStatus`), query hooks, and a Zod schema of three required selects.
- `PROVIDER_OPTIONS` and `PROVIDER_TEMPLATE_OPTIONS` appended to `data/select-options.data.ts`.

### List / add / edit / delete

- **List:** header "Category Provider" + real subcopy, toolbar with search, a provider filter, refresh and "+ Add Category Provider". Columns `No. / Provider / Category / Provider Template / Created At / Action`, selection checkboxes on.
- **Row menu:** two items, `Edit Category Provider` and `Delete`. No third item — no status to toggle.
- **Bulk delete:** a `Delete (N)` toolbar button once rows are checked, opening the same dialog and the same mutation as the row menu with a different set of ids. One reference screenshot shows checkboxes selected but renders the bulk-action area garbled/overlapping; rather than reverse-engineer an illegible control, this reuses the pattern already established for Sub Category. Checkboxes with no resulting action would have been the worse reading.
- **Add / Edit:** one page-based form serving both routes, `useParams({strict:false})` + RHF `values` re-sync, same as every other tab.
- **Preview mirror:** `add` and `$categoryProviderId/edit` mirrored under `/admin/categories-preview/category-provider/*`. The list route already existed.
- **`ProvisionalTabPage.tsx` deleted** — Category Provider was its last consumer, confirmed by grep before removing.

### One structural deviation

`categoryProviderColumns` is exported as a **factory** taking a `Map<categoryId, categoryName>`, unlike every sibling tab's plain const array. The Category column stores a `category_id` that has to be resolved against the Category tab's own records, and the page owns that query. The cell falls back to the raw id rather than rendering blank, so a provider pointing at a deleted category stays visible.

## On deactivation — asked for, deliberately not built

**No Status column and no Deactivate/Activate item.** All five reference images agree, and §6 line 286 says "No status field confirmed". Category Server already set the precedent for a status-less entity in this feature.

**The Figma cross-check could not be completed.** Queried node `22011-2008` three times across the session; every call returned `requires re-authorization (token expired)`, and `claude mcp list` independently reported `figma: ! Needs authentication` both before and after a re-auth attempt. The frontend-engineer memory already notes this file has denied access in-session before.

So this is **recorded as attempted and blocked, not as positive confirmation of absence.** The build follows the five references. If Figma later shows a Status column outside the crop, adding it is a contained change: the field, one column, a `setStatus` service method, and a `StatusConfirmDialog`-backed row item — the component already exists from Category Type.

## Reference leftovers corrected

- Toolbar button **"+ Add Category Server"** → `+ Add Category Provider` (leftover #1).
- Add page header **"Add Category Server"** → `Add Category Provider` (leftover #2). Both tests assert the wrong string is *absent*, not merely that the right one is present — a present-only check passes on a page showing both.
- Footer "of 9999999 **transactions**" → "of N **category providers**" via the existing `entityLabel` prop.
- Delete dialog's "…permanently delete **your account** from our servers" — **fifth** sighting. The shared `DeleteConfirmDialog` was reused, not rebuilt; this tab passes two strings and nothing else.
- Lorem ipsum subcopy and all three field placeholders replaced with real copy.

## Three flagged deviations from a literal reading of the reference

1. **`Uxiotopup` → `UxioTopup`.** The reference and PRD spell it lowercase-t; `features/financial/data/suppliers.data.ts` spells it `UxioTopup`. Reusing the established name was the instruction, so the existing casing wins.
2. **`Mobile Legends Indonesia` → `Mobile Legends`.** The reference's Category column shows a category that does not exist in `categories.data.ts`. Since the column resolves `category_id` against real Category records, `cprov-1` links to `cat-1` "Mobile Legends". Inventing a seventh category to match a screenshot string would have been worse.
3. **`PROVIDER_TEMPLATE_OPTIONS` is invented.** `provider_template` has no defined value set in the PRD or any reference — only the field name. Seeded with the two values visible in the reference's table, extended across the other fixtured categories. Flagged in the file itself; replace when the real integration templates land.

Provider names are **mirrored, not imported**, from `financial`/`integration`: feature isolation forbids cross-feature imports, and `integration.type.ts` states the overlap is deliberately not a shared type.

## Retrospective — the recurring reference bugs across all five tabs

For anyone reviewing this feature's history, four classes of defect repeated in *every* reference round, all traceable to one shadcn-template source duplicated across Figma frames:

| Bug | Sightings | Resolution |
| --- | --- | --- |
| Footer "of 9999999 **transactions**" | 5/5 tabs | `CategoriesTable`'s `entityLabel` prop, added on the Sub Category round |
| Delete body "…permanently delete **your account** from our servers" | 5/5 tabs | One shared `DeleteConfirmDialog` (built 2026-07-27), callers pass wording. Reversible actions get `StatusConfirmDialog` instead, never the delete dialog restyled |
| Breadcrumb hardcoded / stale | Feature-wide | `getCategoryBreadcrumb()` derives `Add/Edit ${tabLabel}` from the path — this tab needed **zero** breadcrumb work |
| Copy-paste label leftovers from the previously-built tab | Category Server (1: "Category Type Name"), Category Provider (2: button + page header) | Corrected, with tests asserting the *wrong* label is absent |

Also worth recording: **two of five tabs were renamed by later references** — "Supplier Category" → Category Provider, "Server Category" → Category Server. Expect tab names to move, and grep all four casings when they do.

The lesson the table makes concrete: each of these was cheaper to fix once in a shared component than five times per tab, and the shared fix only paid off because tabs 3-5 reused it instead of copying the reference again.

## Files touched

- New: `features/categories/{types/categoryProvider.type.ts, data/category-providers.data.ts, services/categoryProviders.service.ts, hooks/useCategoryProviders.ts, schemas/categoryProviderForm.schema.ts}`
- New: `features/categories/components/{CategoryProviderToolbar,categoryProviderColumns,CategoryProviderRowActions}.tsx`
- New: `features/categories/pages/CategoryProviderFormPage.tsx`; rewritten `pages/CategoryProviderPage.tsx`
- **Deleted:** `features/categories/pages/ProvisionalTabPage.tsx`
- Modified: `features/categories/{index.ts, data/select-options.data.ts}`
- New: 4 test files (31 tests)
- Routes: `add/` + `$categoryProviderId/edit/` in both the `_protected` and `_preview` trees; `routeTree.gen.ts` regenerated by `npm run build`, not hand-edited
- Docs: this log

## Verification

- [x] Built TDD-first: 4 test files written and confirmed failing for the right reasons first — 3 on the unresolved `categoryProviders.service` import, and 8 of 9 list assertions against the `ProvisionalTabPage` stub (the 1 pass was the breadcrumb, which was genuinely already wired) — then implemented to green
- [x] `npm run test` passes — 44 files, 280 tests
- [x] `npx tsc -b --force` clean (exit 0). Note `tsc --noEmit` is vacuous in this solution-style project — it checks 0 files
- [x] `npm run lint` clean — 0 errors, 6 warnings (pre-existing TanStack Table `react-hooks/incompatible-library`, unchanged count)
- [x] Renders in **both** light and dark, verified in-browser at `/admin/categories-preview/category-provider`, `/add` and `/cprov-2/edit`. Five columns with no Status, footer "1-5 of 5 category providers", breadcrumbs reading `Category › Category Provider › Add/Edit Category Provider`, edit form pre-filled. Console clean, no errors or warnings
- [x] Greps clean: no rendered `your account`, `9999999 transactions`, or `Add Category Server` in this tab — all remaining hits are explanatory comments, negative test assertions, or the Category Server tab's own legitimate strings
- [ ] **Figma Status-column check BLOCKED** — expired token, see above. Not skipped, not confirmed
- [ ] `/qa-audit` not run this round

## Notes / follow-ups

- **All five tabs of `categories` are now built.** No tab remains provisional, and `ProvisionalTabPage` is gone.
- Re-run the Figma Status-column check once the MCP server is authenticated, and update the deactivation decision above if it turns out to show one.
- `PROVIDER_TEMPLATE_OPTIONS` is invented — replace with the real integration templates when they're defined.
- Swap each `categoryProvidersService` method to a real `api.*` call when the backend lands.
- Transactions' own `DeleteConfirmDialog` is still the last duplicate of the shared dialog, app-wide.
- `data/select-options.data.ts` still hardcodes `CATEGORY_TYPE_OPTIONS` rather than reading from the Category Type service; `PROVIDER_OPTIONS` now joins it as a second hardcoded mirror (of `financial`/`integration` fixtures, deliberately).
