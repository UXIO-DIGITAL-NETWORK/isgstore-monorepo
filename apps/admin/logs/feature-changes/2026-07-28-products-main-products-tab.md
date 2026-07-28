# 2026-07-28 — Product feature: the Main Products tab

**Scope:** new `features/products` slice; two shared-component promotions; sidebar + breadcrumb; PRD/design-system revisions
**Type:** feat
**Author/agent:** @api + @frontend

## What changed

`/admin/products` is a real screen. The sidebar's "Product" entry had been `disabled: true` pointing at `/admin/dashboard` since the shell was built; it now points at a working two-tab feature.

**Third roadmap→active promotion**, after Integration (§4.4) and Category (§4.5), documented the same way: a `§4.6 Product` section with an explicit revision note, plus matching edits to the IA table, §0's non-goals line, §5's roadmap bullet and §6's entity brief. Product had no §4.x spec at all before this — only a one-line entity brief and a roadmap bullet.

### Built

- **Data layer** — `types/product.type.ts`, 12 fixtures in `data/products.data.ts`, `data/select-options.data.ts`, `services/products.service.ts` (`list`/`getById`/`remove`, mock-backed behind the standard swap seam), `hooks/useProducts.ts`.
- **Main Products list** — header, toolbar (search + category filter + price filter + refresh + "+ Add Main Products"), server-mode table with checkbox selection, `No.`, a thumbnail+meta Product cell, a per-variant Variant cell, Game, Created At, two stacked status badges, and a row menu. Row delete and bulk delete both route through one confirmation and one mutation.
- **Routes** — `_protected/products/` (guarded by `requirePermission("products.view")` on the parent only) with `main`, `main/add`, `provider`, and an index redirect; mirrored under `_preview/products-preview/` unguarded.
- **Product Provider tab and the Add route** ship a `ProvisionalNotice` — the tab bar matches the design and the primary button doesn't 404, without inventing a screen that has no reference.

### Scope, decided with the user before building

The reference shows the list only. This round is the list end-to-end; the Add/Edit form is the natural next one. Product Provider exists as a label in the tab bar and nothing more.

### Four corrections to the reference

Every one of these is a defect class already confirmed across the five Category tabs. Sixth sighting for two of them.

1. **Header subcopy** was "lorem ipsum dolor sit amet". Real copy written; a test asserts no `/lorem ipsum/i` survives.
2. **Footer** read "of 9999999 **transactions**". Now "of 12 products", from the real `meta.total`.
3. **The `Price` column contained game names** ("Garena Mobile Leg…", "Free Fire Indonesia") while the actual price sat in the Variant cell — a header/content mismatch of exactly the kind as Sub Category's two columns both labelled "Name". **Confirmed with the user, not inferred**, and renamed `Game`. A test asserts no column named "Price" exists, so a copy-paste can't quietly restore it.
4. **Pagination** is drawn as a static `1 2 3 4`. That's a mock, not a behaviour — the real ±2 sliding window is kept. The "10 Row" page-size label *is* deliberate, so the shared table gained an optional `formatPageSizeLabel`.

### Two status axes, not one repeated badge

The reference stacks two badges per row and three on another. Modelled as `status` (`active | inactive`) plus `is_available` (`Available | Unavailable`, the §6 entity field), with the extra badge being **per-variant** inside the Variant cell. Confirmed with the user. Fixtures deliberately exercise both values of both axes — otherwise half the Status column would never render in a test.

## Two promotions, not two copies

Feature isolation forbids importing across features, so products needed `CategoriesTable` and `DeleteConfirmDialog`. Both were `git mv`d into `src/components/common/` rather than duplicated:

- **`DataTable.tsx`** (was `CategoriesTable`). `entityLabel` is now **required**, not defaulted — the "9999999 transactions" footer has appeared in six consecutive references, so the type checker now forces every caller to name its own noun. `emptyMessage` derives from it when unset. New optional `formatPageSizeLabel`.
- **`DeleteConfirmDialog.tsx`** — already generic; only its import paths moved.

`features/transactions/components/DeleteConfirmDialog.tsx` was **left alone on purpose**: despite the name it's a different component (hardcoded copy, `invoiceNo` prop, no media icon, different footer styling). Folding it in would have restyled a feature nobody asked about.

`features/dashboard/components/DataTable.tsx` now shares a filename with the promoted one. It's a different, client-mode component; merging them is a logged follow-up, not this commit's job.

## Figma: attempted and blocked, for a new reason

The last two feature logs recorded the Figma MCP as token-expired. It now **authenticates fine** — `whoami` returns the account and its two teams — but every call on `l7izBcDr0PtS2FUdMdHFk3` returns *"Looks like you don't have edit access to this file."* The account holds a **View** seat; the Figma MCP requires **edit**.

This matters because it changes the fix: re-authenticating will never work, only a seat change will. Recorded at the top of `design_system.md` so nobody spends another session re-authing.

## Verification

- [x] Built TDD-first. The service test was confirmed failing on an unresolved module before the service existed; the 24 UI cases were confirmed failing on missing content (404 page rendering), not setup crashes, before any component existed.
- [x] `npm run test` — 49 files, 335 tests, green (was 45/294). Full suite run and green immediately before *and* after the promotions, so the categories regression risk was actually measured, not assumed.
- [x] `npx tsc -b --force` clean. (**Not** `tsc --noEmit` — the root tsconfig is solution-style and checks 0 files, so `--noEmit` passes vacuously.)
- [x] `npm run lint` — 0 errors, 6 warnings, all pre-existing and unchanged in count.
- [x] Grep gates: no cross-feature imports in products, no raw hex, no palette classes, no bare HTML in feature TSX.
- [x] In-browser at 1440×1000 on `/admin/products-preview/main`, **both themes**, console clean. Footer reads "1-10 of 12 products", page-size trigger reads "10 Row", pagination renders Previous/1/2/Next for 12 fixtures.
- [x] `/qa-audit` run — findings in `.artifacts/qa-log.md`.
- [ ] Figma reconciliation — **attempted and blocked** (see above). Reconciled against the supplied screenshot only.

## Notes / follow-ups

- **One real a11y finding, pre-existing and app-wide (QA M-1):** `text-success` badges measure **2.87:1** at 12px in light mode, under the 4.5:1 the a11y rule requires. Not introduced here — `/admin/transaction-preview` in light mode independently measures 3.22:1 on its success profit text and 2.13:1 on its warning admin-fee text. Root cause is the light-mode `--success`/`--warning` token values in `src/index.css`, which match what `design_system.md §3` specifies. Deliberately not fixed in this commit: darkening a functional-colour token re-themes five features at once and diverges from the documented design system — that's the user's call, and it's a one-file change when approved. Dark mode measures 6.94–17.18:1 throughout.
- Products has no test for the table's loading/empty/error states (QA L-1). The states exist in the shared `DataTable`; only `transactions` tests them anywhere in the repo. Best fixed once against the shared component.
- Inferred and flagged in §4.6, revise when a reference or the API lands: the "All Price" filter's options (never shown in the reference — modelled as price-range buckets), `game_name` being denormalized, and the Variant cell's "Fix" prefix possibly being a price *type* with only one observable value.
- `cost_price`/`selling_price` from §6's original brief are deliberately **not** modelled yet — the list shows one price per variant and no margin, and the form that would capture cost is still roadmap. Add them with that form.
- Service is `list`/`getById`/`remove` only. No `create`/`update` until the Add form has a reference — an unused mutation is an unused mutation.
