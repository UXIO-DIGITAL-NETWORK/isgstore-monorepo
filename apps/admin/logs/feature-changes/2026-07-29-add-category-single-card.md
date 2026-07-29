# 2026-07-29 — Add Category: four section cards merged into one

**Scope:** categories / Add Category form (`AddCategoryPage`)
**Type:** style
**Author/agent:** @frontend

## What changed

- The four stacked section cards — Basic information, Category form, Media & description, SEO — are now one card, split by `divide-y divide-border` instead of by gaps between separate cards.
- The page-title block ("Add Category" + subcopy) stays its own card above, as before.
- Cancel/Save stay outside the card as the form footer.

## Why

- Requested: the sections read as one form, not four independent objects; a single hairline between them is enough separation and drops three redundant card borders from the page.
- The title was briefly folded into the same card and then pulled back out on request — the page header is a page-level object, not a form section.

## Files touched

- `src/features/categories/pages/AddCategoryPage.tsx`

## Verification

- [x] Presentation-only change — the existing 13 `AddCategoryPage` tests are behavioral (roles/labels/copy) and cover it unchanged
- [x] `npm run test` passes (categories: 22 files / 173 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (6 pre-existing warnings elsewhere, 0 errors)

## Notes / follow-ups

- The other category form pages (Sub Category, Provider, Server, Type) still use stacked section cards — not touched; match them if the single-card shape is adopted as the house form pattern.
