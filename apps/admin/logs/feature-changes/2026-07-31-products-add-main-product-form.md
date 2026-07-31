# 2026-07-31 — Products: the real Add Main Products form

**Scope:** products / `/admin/products/main/add` — plus two component promotions to `components/common`
**Type:** feat
**Author/agent:** @api + @frontend + @qa (`/build-feature`)

## What changed

- `AddMainProductPage` is a real form instead of the `ProvisionalNotice` stub: **Basic information** (Product Name, Nickname Validation, Sub Name, Product Code, Product Access, Product Tag, Category, Sub Category — laid out 2 / 3 / 3 columns as the frame shows) and **Media & description** (Product Logo dropzone, Description with a live `N/280 characters` · `N% used` counter), with a Cancel/Save footer.
- Sub Category lists only the selected Category's entries and clears when Category changes.
- Data layer: `Product` gained the form's optional fields (`sub_name`, `sub_category_name`, `nickname_validation`, `access`, `tag`, `description`); `productsService.create` **unshifts** so the new row is on page 1 the form redirects back to; `useCreateProduct` mirrors `useCreateCategory`.
- `CATEGORY_OPTIONS` entries now carry `game_id`/`game_name` (new `CategoryOption` type), so a product created from a form with no Game field still gets the denormalized game the entity requires.
- **Promotions** (feature isolation — `products` cannot import from `categories`): `CategoryImageUpload` → `components/common/ImageDropzone.tsx` (its own comment prescribed this once a second feature needed it) and `AddCategoryPage`'s local `SelectField` → `components/common/SelectField.tsx`, gaining a `disabled`/`emptyLabel` for the dependent select. Both categories callers updated; all 173 categories tests stayed green untouched, which is the proof the move was behaviour-neutral.

## Why

- The frame supplied this round is the form's first reference, so the placeholder route can ship the real screen.
- Three corrections, all copy-paste residue from Add Category (the sixth instance of this defect class in this feature): the header read "Add Category" → **Add Main Products**; the dropzone was labelled "Category Logo" → **Product Logo**; "Product Acces" → **Product Access**. The frame also shows "0/280 characters" beside "52% used" — one number, not two, so both derive from the same length.
- **Decided with the user this round:** no pricing/variant fields (build exactly the frame), infer the three unopened select lists, and make Sub Category depend on Category.
- **Provisional pending the API contract:** required-ness is inferred (name, code, category — the frame marks nothing); Product Access / Product Tag / the per-category Sub Category map are inferred and flagged in `select-options.data.ts`; the logo's file name stands in for an uploaded URL until the §4.9 upload helper exists.

## Files touched

- `src/features/products/pages/AddMainProductPage.tsx`, `schemas/productForm.schema.ts` (new), `types/product.type.ts`, `data/select-options.data.ts`, `services/products.service.ts`, `hooks/useProducts.ts`
- `src/features/products/tests/AddMainProductPage.test.tsx` (new), `tests/products.service.test.ts`
- `src/components/common/ImageDropzone.tsx` (moved), `src/components/common/SelectField.tsx` (new)
- `src/features/categories/pages/AddCategoryPage.tsx`, `pages/SubCategoryFormPage.tsx` (import the promoted components)

## Verification

- [x] Built TDD-first: the 3 service cases failed with `create is not a function`, then the 8 page cases failed against the stub, before either layer existed
- [x] `npm run test` passes (52 files, 358 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors, 7 `react-hooks/incompatible-library` warnings (the 7th is this page, the same notice every React-Hook-Form page carries)
- [x] `/qa-audit` run — `.artifacts/qa-log.md`; two findings fixed during the audit (Save now `<Can permission="products.create">`-gated, `tabular-nums` on the counters), three logged as follow-ups
- [x] Renders in **both** light and dark — verified in-browser, every surface resolves to a chroma-0 token in both
- [x] Layout checked in-browser against the frame: 2 / 3 / 3 column rows, correct field order, both sections, Cancel/Save
- [ ] Reconciled against Figma frame — the file is still View-only for this account (§4.6); reference supplied as an image

## Notes / follow-ups

- A product created here has **no variants**, so its Variant and Price cells are empty in the list. Deliberate — revisit when a variant/pricing frame lands (and with it the Edit form and `cost_price` capture §5 asks for).
- `AddCategoryPage`'s Save is still ungated; wrap it in `<Can permission="categories.create">` next time that page is touched.
- Form errors are adjacent to their inputs but not associated via `aria-invalid`/`aria-describedby` — one pass across all five form pages, not a products-only fix.
- `EditTransactionForm` still has its own inline dropzone; fold it into `ImageDropzone` next time that form is touched.
