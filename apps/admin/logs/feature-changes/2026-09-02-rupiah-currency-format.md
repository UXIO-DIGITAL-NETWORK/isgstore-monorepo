# 2026-09-02 — "Rp" prefix and Indonesian separators everywhere

**Scope:** `utils/currency`, dashboard charts
**Type:** fix
**Author/agent:** you

## What changed

- `formatCurrency` is pinned to `id-ID`, normalises the non-breaking space, and returns `"-"` for a non-finite value.
- `PerformanceChartCard` passes a per-chart `formatter` for its money series.

## Why

- The real problem was not a missing "Rp" but the wrong thousands separator, plus `IDR` (not `Rp`) appearing on English-locale pages. Rupiah is rupiah regardless of UI language, so the `locale` parameter is deliberately ignored for currency — with a comment saying why, or the next person will "fix" it back.
- **`src/components/ui/chart.tsx` was not given a currency default.** It is vendored shadcn output that is overwritten on re-add, and its tooltip also serves non-money charts — baking "Rp" in there would have stamped a currency onto transaction counts.

## Files touched

- `src/utils/currency.ts`, `src/utils/currency.test.ts`
- `src/features/dashboard/components/PerformanceChartCard.tsx`
- `src/components/ui/chart.tsx` (two unrelated genuine bugs only)

## Verification

- [x] `npm run test` passes
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean
- [x] Both themes

## Notes / follow-ups

- Money **inputs** are only decorated with a positioned "Rp"; thousands separators are never added inside `<input type="number">` — a spaced value is invalid per spec and Safari/Firefox return `""`, which would silently save an empty price.
