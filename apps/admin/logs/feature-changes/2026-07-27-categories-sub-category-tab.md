# 2026-07-27 — Sub Category tab (list, add/edit, single + bulk delete)

**Scope:** `features/categories` — Sub Category tab, plus three cross-cutting corrections that touch every Category tab
**Type:** feat
**Author/agent:** you

## What changed

### Sub Category tab (product_requirements.md §4.5, lines 206–214)

- **Data layer:** new `SubCategory` entity (`id`, `category_id`, `name`, `currency_name`, `logo_url?`, `description?`, `status`, `created_at`, `updated_at`), 4 varied mock fixtures, a mock-backed `subCategoriesService` (`list`/`getById`/`create`/`update`/`remove`) behind the same interface shape as `categoriesService`, TanStack Query hooks, and a Zod form schema.
- **List:** header "Sub Category" + real subcopy, toolbar (search, parent-category filter, refresh, "+ Add Sub Category", bulk "Delete (N)"), table columns `No. / Name / Currency Name / Created At / Status / Action`, row menu `Edit Sub Category` / `Delete`. Replaced the `ProvisionalTabPage` stub in place.
- **Add / Edit:** one page-based form (`SubCategoryFormPage`) at `/admin/categories/sub-category/add` and `/admin/categories/sub-category/$subCategoryId/edit`, edit pre-filled via RHF's `values`. No modal, consistent with how Transaction's edit flow was converted on 2026-07-25.
- **Delete:** row menu and toolbar bulk button share one `DeleteSubCategoryDialog` and one `useDeleteSubCategories` mutation, differing only in the id set. Copy adapts to count.
- **Preview mirror:** the add and edit routes are mirrored under `/admin/categories-preview/sub-category/*`, so the whole flow is clickable without hitting the auth-guarded routes. No preview-specific components — every href is derived from `useLocation().pathname`.

### Three corrections called out explicitly

1. **The breadcrumb leaf is now derived from the active tab, across all Category tabs.** The tab *segment* was already dynamic (`getCategoryBreadcrumb` in `DashboardNavbar.tsx`), but the leaf was hardcoded to the literal `"Add Category"` — wrong on every tab except Category itself. It now reads `Add ${tabLabel}` / `Edit ${tabLabel}`, and handles the `edit` leaf, which it previously ignored entirely. The reference showed "Category › Category" on all five frames including the Add Sub Category page; nothing in the shipped code was hardcoded per-page, so this one function was the only fix needed.
2. **The fifth tab was corrected from "Supplier Category" to "Category Provider"** — in `product_requirements.md` §4.5 line 188 (the clearer reference in this round shows the real label) **and** in code: tab label, breadcrumb label map, URL segment `/supplier-category` → `/category-provider`, `SupplierCategoryPage.tsx` → `CategoryProviderPage.tsx`, barrel export, and two existing test assertions.
3. **The delete-confirmation copy was rewritten from a completely unrelated account-deletion template.** The reference's dialog body was shadcn/ui's own AlertDialog documentation example verbatim — "This action cannot be undone. This will permanently delete your account from our servers." — describing deletion of a user account, which has nothing to do with a taxonomy record. Its title ("Are you absolutely sure?") is from the same stock example and was rewritten too. Now: `Delete this sub category?` / "…permanently delete this sub category and remove it from the storefront.", pluralising with the count for bulk. Buttons Cancel / Continue per §4.5 line 212.

### Other reference leftovers corrected

- Second column labelled "Name" (values "Diamonds"/"Diamond") → **Currency Name**.
- Footer "of 9999999 **transactions**" → "of N **sub categories**" (`entityLabel` prop on the shared table, so the noun can never be inherited from Transaction again).
- The row-menu frame's table (Header/Section Type/Status/Target/Limit/Reviewer, "Cover Page"/"Advanced Algorithms…") is the shadcn demo dataset — ignored; only its two menu items were used.
- Every lorem-ipsum placeholder replaced with real copy ("Select a category", "e.g. Mobile Legends: Global", real page subcopy).
- Dropzone caption "~000×000 px" → "800×600 px".
- Description counter "0/280 characters" next to a mismatched "52% used" → percentage derived from the actual length (0 chars = 0% used), the same fix already applied to the Category form's SEO section.

### Shared-component changes (defaults preserve existing Category behaviour)

- `CategoriesTable`: `entityLabel`, `showRowNumber`, `onSelectionChange` props. **Also fixed a latent infinite-render bug**: the selection-reset effect keyed on the `data` array identity, and callers pass `data?.data ?? []`, so a fresh `[]` arrived every render. Harmless until a parent re-rendered in response to selection — then it looped and the route crashed to the 503 boundary. Now keyed on the joined row ids.
- `CategoryImageUpload`: `accept` / `formatsLabel` props. Sub Category's Logo takes **JPG, JPEG, PNG, WEBP** — one more format than Category's own logo field, per §4.5 line 210.
- `CategoryTabsLayout`: hides the tab strip on `/edit` as well as `/add`.

## Why

- §4.5 was updated 2026-07-14 with confirmed Sub Category detail; this is the build against it.
- Corrections 1–3 are all instances of the same recurring problem §4.5 line 190 warns about: a single shadcn-template source duplicated across Figma frames. Each was cross-checked against what the page actually does rather than trusted at face value.
- `currency_name` on the Add form is **inferred**, not confirmed: the reference's form crop shows only Category / Sub Category Name / Logo / Description, but the list column and the §6 entity both require the value, so there must be an input for it.
- All fixtures and the service are **mock-backed and provisional** pending the real API contract.

## Files touched

- New: `features/categories/{types/subCategory.type.ts, data/sub-categories.data.ts, services/subCategories.service.ts, hooks/useSubCategories.ts, schemas/subCategoryForm.schema.ts}`
- New: `features/categories/components/{SubCategoryToolbar,subCategoryColumns,SubCategoryRowActions,DeleteSubCategoryDialog}.tsx`
- New: `features/categories/pages/SubCategoryFormPage.tsx`; rewritten `pages/SubCategoryPage.tsx`; renamed `pages/SupplierCategoryPage.tsx` → `pages/CategoryProviderPage.tsx`
- New: 5 test files under `features/categories/tests/`
- Modified: `features/categories/{index.ts, layouts/CategoryTabsLayout.tsx, pages/ProvisionalTabPage.tsx, components/CategoriesTable.tsx, components/CategoryImageUpload.tsx}`
- Modified: `features/dashboard/components/DashboardNavbar.tsx`
- Routes: 4 new under `admin/_protected/categories/sub-category/` and `admin/_preview/categories-preview/sub-category/`; `supplier-category/` → `category-provider/` in both trees; `routeTree.gen.ts` regenerated via `npm run build`
- Docs: `.agents/context/product_requirements.md` §4.5

## Verification

- [x] Built TDD-first: 5 test files written first, confirmed failing for the right reasons (unresolved `subCategories.service` import, missing tab rename, stub page with no toolbar/table), then implemented to green
- [x] `npm run test` passes — 32 files, 188 tests
- [x] `npx tsc --noEmit` clean — **and** `npx tsc -b --force`, which is the check that actually type-checks this solution-style project
- [x] `npm run lint` clean — 0 errors (6 pre-existing `react-hooks/incompatible-library` warnings about TanStack Table, unchanged count)
- [x] Renders in **both** light and dark, verified in-browser at `/admin/categories-preview/sub-category` and `…/add`. Dark: full visual check. Light: the DevTools screenshot call hung repeatedly, so light was verified via the a11y tree plus computed styles — tokens resolve to the true-neutral light values (`--background` `oklch(1 0 0)`, `--foreground` `oklch(0.145 0 0)`), and measured contrast on white is 4.74:1 for muted text, the footer count, and the Inactive badge
- [x] Bulk-delete dialog copy confirmed in-browser: title "Delete 2 sub categories?", body "…permanently delete these 2 sub categories and remove them from the storefront."
- [x] Grepped for `"your account"` and `"9999999 transactions"` — no rendered occurrences; remaining hits are only explanatory comments and negative test assertions
- [ ] `/qa-audit` not run this round

## Follow-up polish (same day, requested)

- **Toolbar labels made visible** on the Sub Category tab ("Search", "Category"), matching the Category tab's toolbar. They were `sr-only` to match the reference, which shows none — two sibling tabs with differently-labelled toolbars read as inconsistent.
- **Bulk "Delete (N)" now uses full-strength `--destructive`**, matching the row menu's red Delete. shadcn's `destructive` button variant carries `dark:bg-destructive/60`, which rendered washed out in dark (the default theme). Overridden with `dark:bg-destructive`; tailwind-merge in the Button's `cn` drops the `/60` rule, so this wins deterministically rather than on stylesheet order.
- **Row action menus rounded to `rounded-2xl`** on both the Category and Sub Category tabs, matching `RowActionMenu` on the transaction page (measured: 14px on all three).
- **Fixed a real bug in `AlertDialogAction` (`components/ui/alert-dialog.tsx`) while doing the above.** It rendered `<Button variant asChild>` around the Radix action and put the caller's `className` on the *inner* element, so the className never went through Button's `cn`/tailwind-merge. All three delete dialogs in the app passed `className="bg-destructive …"` and all three silently lost the specificity tie with the Button's own `bg-primary` — every destructive confirm button was rendering **near-black instead of red** (measured `oklch(0.205 0 0)`). `className` now goes to the Button. The three call sites (`DeleteSubCategoryDialog`, `DeleteCategoryDialog`, transactions' `DeleteConfirmDialog`) were switched to `variant="destructive"` + `dark:bg-destructive`, so all three confirm buttons now match `--destructive` exactly in both themes. **Transactions was not in the requested scope but shares the fixed primitive** — it was aligned rather than left half-fixed.

## Flagged — pre-existing, not introduced here

- **`--success` fails AA in light mode.** The Active status badge uses `text-success`, and measured contrast on a white card is **3.22:1** — below the 4.5:1 that `.claude/rules/accessibility.md` requires for body text. This is the shipped light-mode token (`src/index.css:23`, `oklch(0.627 0.194 149.214)`), not a local choice: `TrendPill`, `StatusBadge`, `ChannelCard`, `CategoryStatusToggle`, `automaticColumns` and `IntegrationPage` all render it identically, so every shipped "up"/"success" indicator has the same ratio. Deliberately **not** changed here — retuning a token seven components depend on is a design-system decision, not a side effect of a feature commit. Raised for a separate call: darken light-mode `--success` to ≈`oklch(0.52 0.17 149)` (≈4.6:1) or pair it with a `bg-success/10` fill. Dark mode's value is fine.

## Notes / follow-ups

- Swap each `subCategoriesService` method body to a real `api.*` call when the backend lands; `remove` is per-id and the bulk path maps over it — replace with a real batch endpoint if the API exposes one.
- `logo_url` stores the file name as a stand-in for the uploaded URL (UI-first, no upload backend yet), same as the Category form.
- The parent-category filter loads one page of 100 categories; swap to a searchable/paged combobox if the real list grows.
- Category's own row-menu "Edit" is still a "coming soon" toast — no Edit Category page exists and §4.5 doesn't add one this round.
- Checkbox selection and bulk delete were **not** added to the Category tab; only Sub Category's reference shows them.
