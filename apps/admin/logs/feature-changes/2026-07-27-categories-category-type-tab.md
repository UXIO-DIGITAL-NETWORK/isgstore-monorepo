# 2026-07-27 — Category Type tab (list, add/edit, delete + deactivate confirmations)

**Scope:** `features/categories` — Category Type tab, plus a feature-wide delete-dialog consolidation
**Type:** feat
**Author/agent:** you

## What changed

### Category Type tab (product_requirements.md §4.5, §6)

- **Data layer:** new `CategoryType` entity (`id`, `name`, `is_voucher`, `status`, `created_at`, `updated_at`), 4 deterministic fixtures, a mock-backed `categoryTypesService` (`list`/`getById`/`create`/`update`/`remove` **plus `setStatus`**), query hooks, and a two-field Zod schema.
- **List:** header "Category Type" + real subcopy, toolbar (search + refresh + "+ Add Category Type", no parent filter — this tab has no parent), columns `No. / Name / Voucher / Status / Action`, no checkbox column and no bulk delete.
- **Add / Edit:** one page-based form at `/admin/categories/category-type/add` and `…/$categoryTypeId/edit`, name field plus the voucher checkbox. Edit deliberately does **not** send `status` — that is owned by the row menu's toggle.
- **Row menu:** `Deactive`/`Activate` (label and target status derived from the row, so an inactive row doesn't offer a dead "Deactive"), `Edit Category Type`, `Delete`.
- **Preview mirror:** add and edit routes mirrored under `/admin/categories-preview/category-type/*`.

### The delete dialog is now one component (the headline change)

The reference showed shadcn's "…permanently delete **your account** from our servers" for a **third** time. That confirmed it as one never-customized dialog in the source design rather than three separate mistakes, so this round consolidated the code to match:

- **New `components/DeleteConfirmDialog.tsx`**, generalized from the Sub Category dialog. Takes `title` + `description`; owns the `Trash2` media icon, the full-bleed action bar, `rounded-2xl`, the destructive styling, and the confirm label.
- **Three call sites migrated:** Sub Category (row + bulk), Category, Category Type. `DeleteSubCategoryDialog.tsx` and `DeleteCategoryDialog.tsx` are **deleted**.
- This is the **first** tab that forced the consolidation — the previous round built a Sub-Category-specific dialog. Future tabs reuse this one; they should not write a fourth.
- Transactions' identically-shaped `DeleteConfirmDialog` is **left alone** — separate feature, outside this ask, and cross-feature imports are banned. It remains the last duplicate app-wide.

### The deactivate confirmation is a deliberately separate component

`components/StatusConfirmDialog.tsx` is **not** the delete dialog with different words. The reference put the same account-deletion body under a title reading "Are you absolutely sure deactive?" — copy that matches neither the action nor its own title. Deactivating is reversible, so this dialog:

- uses a neutral `Power` icon on `bg-muted`, not a destructive-tinted `Trash2`;
- confirms with the **default** button variant — measured white `oklch(0.985 0 0)` in dark, near-black `oklch(0.205 0 0)` in light, never `--destructive`, matching the reference's white/muted button;
- says "This will hide it from being selectable. You can reactivate it anytime." and never "permanently" or "cannot be undone";
- labels its confirm "Deactivate" / "Activate" by direction.

### Confirm label standardized to "Delete"

The Category Type reference says "Delete" where the Sub Category reference said "Continue". Standardized on **"Delete"** going forward. That changed Sub Category's shipped button and three lines in `SubCategoryDeleteFlow.test.tsx` (two `getByRole` queries plus one test title) — a spec change per §4.5, not a loosened test.

### Other reference leftovers corrected

- **Status vocabulary:** the reference shows "Active" in one screenshot and "In Process" in another for the same two rows. "In Process" is the shadcn demo dataset's review-workflow vocabulary, already discarded on the Category tab; only `active | inactive` exists, which is also what the "Deactive" action implies. The contract test asserts no other status can appear.
- **Footer noun:** "of 9999999 transactions" → "of N category types" via the existing `entityLabel` prop.
- **Placeholders:** real hint (`e.g. Voucher, Direct Top Up`) and real header subcopy. The voucher checkbox label and helper text are the one deliberately-written part of this reference and are used **verbatim**.
- **Drag handles** (⠿) in the leading column are dropped — the repo already replaced drag-to-reorder with absolute row numbering (commit `9d2ae7b`).
- **Fixture names:** the reference's rows are "Mobile Legends" and "Pc Games". Mobile Legends is a specific game — a *Category*, not a category *type* — so reproducing it would contradict §6 and make the Category form's type filter nonsensical. Fixtures use Mobile Game / PC Game / Voucher / Direct Top Up, mirroring the existing `CATEGORY_TYPE_OPTIONS`. **Flagged as a deliberate deviation.**

### Shared table change

`CategoriesTable` gains `enableSelection?: boolean` (default `true`). The `__select` column was previously injected unconditionally, so there was no way to render a table without checkboxes. Category and Sub Category are unaffected.

### No breadcrumb work needed

The previous round's fix already derives the trail from the active tab, and `CATEGORY_TAB_LABELS` already maps `category-type`. It produced `Category › Category Type` and `Category › Category Type › Add Category Type` with no changes — exactly what this reference shows. Tests now pin both.

## Why

- §4.5 was updated 2026-07-14 with confirmed Category Type detail; this builds against it.
- The consolidation is the direct response to the same boilerplate appearing a third time: fixing it per-tab would guarantee a fourth occurrence.
- Fixtures and service are **mock-backed and provisional** pending the real API contract.

## Files touched

- New: `features/categories/{types/categoryType.type.ts, data/category-types.data.ts, services/categoryTypes.service.ts, hooks/useCategoryTypes.ts, schemas/categoryTypeForm.schema.ts}`
- New: `features/categories/components/{DeleteConfirmDialog,StatusConfirmDialog,CategoryTypeToolbar,categoryTypeColumns,CategoryTypeRowActions}.tsx`
- New: `features/categories/pages/CategoryTypeFormPage.tsx`; rewritten `pages/CategoryTypePage.tsx`
- Deleted: `features/categories/components/{DeleteSubCategoryDialog,DeleteCategoryDialog}.tsx`
- Modified: `features/categories/{index.ts, components/CategoriesTable.tsx, components/CategoryRowActions.tsx, components/SubCategoryRowActions.tsx, pages/SubCategoryPage.tsx}`
- New: 4 test files; modified `tests/SubCategoryDeleteFlow.test.tsx`
- Routes: 4 new under `category-type/` in both the `_protected` and `_preview` trees; `routeTree.gen.ts` regenerated via `npm run build`
- Docs: `.agents/context/product_requirements.md` §4.5/§6

## Verification

- [x] Built TDD-first: 4 test files written and confirmed failing for the right reasons (unresolved `categoryTypes.service` import; stub page with no toolbar/table; the Sub Category button still reading "Continue"), then implemented to green
- [x] `npm run test` passes — 36 files, 221 tests
- [x] `npx tsc --noEmit` clean, **and** `npx tsc -b --force`, which is the check that actually type-checks this solution-style project
- [x] `npm run lint` clean — 0 errors (6 pre-existing TanStack Table warnings, unchanged count)
- [x] Renders in **both** light and dark, verified in-browser. Measured confirm-button backgrounds — delete `oklch(.704 .191 22.216)` dark / `oklch(.577 .245 27.325)` light (both exactly `--destructive`, label contrast 4.77:1); status `oklch(.985 0 0)` dark / `oklch(.205 0 0)` light (never destructive, contrast 17.18:1). Media blocks likewise destructive-tinted vs muted.
- [x] Click-through: Deactive → confirm → row flips to `inactive` and that row's menu now reads "Activate"
- [x] Greps: no rendered `"your account"`, `"9999999 transactions"`, `"In Process"` or `"Continue"` anywhere — remaining hits are explanatory comments and negative test assertions only
- [ ] `/qa-audit` not run this round

**Note on visual checks:** the DevTools screenshot call hangs whenever a Radix overlay is open in this environment, so dialog styling was verified via the a11y tree plus computed styles rather than images. That is a stronger check for the red-vs-not-red question anyway, since it compares against the token directly.

## Notes / follow-ups

- Swap each `categoryTypesService` method to a real `api.*` call when the backend lands. `setStatus` exists as its own method because a real backend will likely expose a dedicated status endpoint.
- `data/select-options.data.ts` still hardcodes `CATEGORY_TYPE_OPTIONS` (Mobile Game / PC Game / Voucher), which the Add Category form's "Category Type" select consumes. Now that a real `CategoryType` service exists, that constant should be fed from it — a change to the Category tab, deliberately out of scope here.
- The feature now has two status renderings: a `Switch` on Category (toggles with no confirmation) and a read-only `Badge` on Sub Category / Category Type. The new `StatusConfirmDialog` is **not** wired into Category's switch. Worth reconciling if a third pattern is ever needed.
- Transactions' `DeleteConfirmDialog` is the last remaining duplicate of the shared dialog, app-wide.
- The `--success` contrast issue (3.22:1 on white, flagged last round) is untouched; the Voucher checkmark and Status badge both reuse that token.
