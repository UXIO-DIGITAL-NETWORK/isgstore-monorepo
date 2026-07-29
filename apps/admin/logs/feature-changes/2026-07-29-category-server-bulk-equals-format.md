# 2026-07-29 — Category Server bulk import: `Name,Value` → `Name=Value`

**Scope:** categories / Add Category Server "+ Add Bulk" panel
**Type:** refactor
**Author/agent:** @frontend

## What changed

- `parseBulkOptions` splits each line on the **first `=`** instead of the last `,` (e.g. `ASIA=asia`).
- Copy follows: hint "One option per line, as Name=Value.", error "Line N is not in the Name=Value format.", placeholder `ASIA=asia / EUROPE=europe`.
- Both test files updated to the new format first, then the parser.

## Why

- Requested format change. It also removes the last-comma trick: names legitimately contain commas (`TW, HK, MO=os_cht`), values are slugs and never contain `=`, so the split is unambiguous.

## Files touched

- `src/features/categories/utils/parseBulkOptions.ts`
- `src/features/categories/components/CategoryServerOptionsBuilder.tsx`
- `src/features/categories/tests/parseBulkOptions.test.ts`
- `src/features/categories/tests/AddCategoryServerPage.test.tsx`

## Verification

- [x] Tests updated to the new spec before the implementation
- [x] `npm run test` passes (categories: 22 files / 173 tests)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (6 pre-existing warnings elsewhere, 0 errors)

## Notes / follow-ups

- All-or-nothing parsing is unchanged: one bad line rejects the whole paste and keeps the text for fixing.
