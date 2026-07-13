# 2026-07-13 — Add Category form: Media & description + SEO sections

**Scope:** categories — Add Category form (`AddCategoryPage`)
**Type:** feat
**Author/agent:** you (main)

## What changed
- Extended the single Add Category form (there is no separate Edit form — Edit is a
  "coming soon" toast, so the whole form lives inlined in `AddCategoryPage.tsx`) with two new
  card sections inserted after "Category form" and before the Save/Cancel actions, per
  `product_requirements.md §4.5`:
  - **Media & description** (subcopy "Category logo and description content for the product
    page."): a "Category Logo" upload dropzone (JPG/JPEG/PNG ≤ 10MB) with caption "3:4 ratio
    recommended · max display 800×600 px", plus a "Description" textarea.
  - **SEO** (subcopy "Meta tags for the category page on search engines."): "Meta Title" input,
    "Meta Description" textarea with a live character counter ("N/280 characters" + "N% used",
    percentage derived from the count, capped at 280), an "OG Image" upload dropzone
    (caption "1.91:1 ratio recommended · max display 1200×630 px"), "Meta Keyword" input, and a
    "Meta Robot" select (Index/Follow directives, placeholder "Select").
- Added a small local `CategoryImageUpload` component (drag/drop + hidden file input + Browse
  button + caption), reused by both upload fields — a categories-local copy of the transactions
  "Invoice Proof" dropzone pattern.
- Extended the `Category` type (`logo_url?`, `description?`, `meta_title?`, `meta_description?`,
  `og_image_url?`, `meta_keywords?: string[]`, `meta_robots?`) per §6, the Zod form schema
  (`logo`/`ogImage` File validators mirroring `editTransaction.schema`, `metaDescription` max
  280, exported `META_DESCRIPTION_MAX`), `META_ROBOTS_OPTIONS`, the `onSubmit` payload mapping
  (comma-split keywords → string[]; file name stands in for the not-yet-existent upload URL),
  and populated the new optional fields on the first mock fixture row for realism.
- Extended `SelectField` with an optional `placeholder` prop (default "Type to search...") so
  Meta Robot can render "Select".

## Why
- The Media & description + SEO sections were newly transcribed into §4.5 from a further-scrolled
  reference; building them completes the Add Category form to the documented spec.
- **Flagged inferences (not explicitly confirmed by the reference):**
  1. **OG Image relabel** — the reference labels the second SEO upload "Category Logo" again,
     identical to the Media section's field. A duplicate label is almost certainly a Figma
     copy-paste artifact; a separate image field inside an SEO section far more plausibly
     represents an OG/social-share preview image (a standard, distinct SEO concept). Built and
     labelled it "OG Image" (`og_image_url`).
  2. **800×600 px** dimension is a reasonable placeholder standing in for the reference's
     unfilled "~000×000 px" caption — not a confirmed figure. (OG's "1200×630" caption is the
     conventional OG dimension, likewise provisional.)
  3. **Description** textarea is inferred — the Media section's subcopy promises "description
     content" but the reference crop cuts off before showing the field.
- Counter built to actually reflect the entered length (0 chars = 0% used); the reference's
  static "0/280 characters" next to "52% used" is a non-functional mock and was not reproduced.

## Files touched
- `src/features/categories/types/category.type.ts`
- `src/features/categories/schemas/categoryForm.schema.ts`
- `src/features/categories/data/select-options.data.ts`
- `src/features/categories/components/CategoryImageUpload.tsx` (new)
- `src/features/categories/pages/AddCategoryPage.tsx`
- `src/features/categories/data/categories.data.ts`
- `src/features/categories/tests/AddCategoryPage.test.tsx` (extended)

## Verification
- [x] Built TDD-first: extended the existing `AddCategoryPage.test.tsx` with 4 new cases
  (both new headings/subcopies, all 7 new fields by label, live counter count↔percent sync,
  new fields present in the create payload); confirmed they failed for the right reason
  (fields absent), then implemented to green.
- [x] `npm run test` passes (20 files, 122 tests)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` — no new errors (baseline 8 errors/4 warnings pre-existing & unrelated →
  8 errors/5 warnings; the one added warning is the React-Compiler `incompatible-library`
  skip notice on RHF `watch()`, matching the existing warnings for `useReactTable`/transactions
  `watch()`)
- [ ] `/qa-audit` not run this change
- [x] Renders in **both** light and dark (verified via chrome-devtools screenshots at the two
  new sections; counter confirmed live at 14/280 = 5%)
- [x] Reconciled against the §4.5 transcription of this further-scrolled reference (the PRD
  documents this scroll position in prose; the Figma frame was not re-pulled)

## Notes / follow-ups
- Uploads are UI-first: `logo_url`/`og_image_url` currently carry the selected file's name as a
  stand-in. Swap to the URL returned by the multipart upload helper (`system_architecture.md
  §4.9`) once the backend/helper lands — the helper named in §4.9 does not exist yet.
- `CategoryImageUpload` duplicates the transactions dropzone. If a third upload appears,
  promote a shared upload primitive to `components/common` and refactor both call sites (not
  done now to keep this diff scoped).
- `useUpdateCategory` already exists but is unused; whenever an Edit Category page is built it
  should reuse this same form (extract it then).
