# 2026-08-25 — Category Provider: Uxiotopup-only provider + create a category inline

**Scope:** `src/features/categories/*`
**Type:** feat
**Author/agent:** you

## What changed

Two frictions in the Add/Edit Category Provider dialog, both reported from real use.

### Provider is restricted to suppliers that have a catalogue
The select offered `Uxiotopup`, `VIP Reseller` and `Internal System`. Only Uxiotopup
has a catalogue integration, so the other two could be picked and would then dead-end
at the Provider Category field below. (`Internal System` is the platform's own
supplier — not something to map at all.)

- `INTEGRATED_PROVIDER` became `INTEGRATED_PROVIDERS` (a list), still name-matched
  because `suppliers` carries no "integrated" flag — `is_system` marks the internal
  supplier, not this. A second integrated supplier is a one-line addition.
- With one offerable provider, it is **preselected**: opening a select to pick its
  only option is a click that carries no decision. Add mode only; on edit the stored
  value wins.
- **An existing row pointing at a retired supplier keeps that supplier visible**, as a
  disabled option. Filtering it out would have rendered an empty select on edit, which
  reads as lost data. The fixtures contain Zelpoint and Topupkuy rows, so this is a
  real path, not a hypothetical.

### A category can be created without leaving the dialog
Previously a missing category meant closing the dialog, crossing to the Category tab,
filling a 545-line form, and starting over.

- `+ New category` beside the Category label reveals an inline panel with the three
  fields `POST /v1/categories` actually requires: **Category Type, Name, Code**. Slug
  is derived, status starts active. Everything else is nullable server-side and belongs
  in the full form.
- On success the new category is **selected immediately** and the panel closes.
- Not a nested dialog: every one of the repo's 25 `*FormDialog`s is a leaf, and there
  was no nesting precedent to follow.

## Why the panel is not a `<form>`

The dialog around it already is one. Nested forms are invalid HTML and the inner
submit would bubble out and save the outer dialog. Everything in the panel is a
`type="button"`, and its validation is local state rather than part of the parent's
zod schema — an untouched panel must never block the mapping's own Save. There is a
test for exactly that.

## Notes

- `slugify()` was private to `CategoryFormDialog`; promoted to
  `src/features/categories/lib/slugify.ts` so both forms derive slugs identically.
  The column is unique server-side, so a drift there would surface as an unexplainable 422.
- `categoriesService.quickCreate` + `useQuickCreateCategory` take a narrow
  `CategoryQuickCreateInput` rather than repeating the full dialog's `as never` cast.
  `toFormData` only appends what is present, so nothing empty is sent.
- The "no catalogue integration" hint was expected to become dead once the list was
  filtered. It did not: editing a legacy row with a retired supplier still reaches it,
  so it stays.

## Files touched

- `src/features/categories/components/{CategoryProviderFormDialog,InlineCategoryCreate,CategoryFormDialog}.tsx`
- `src/features/categories/{lib/slugify.ts,services/categories.service.ts,hooks/useCategories.ts}`
- `src/features/categories/tests/AddCategoryProviderPage.test.tsx`

## Verification

- [x] `npm run test` — 82 files, 471 tests, green (also under `CI=1 TZ=UTC`)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (10 pre-existing react-compiler warnings)
- [ ] Not exercised against the live API.
