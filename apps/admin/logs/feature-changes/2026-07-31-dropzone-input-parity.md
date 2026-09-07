# 2026-07-31 — Image dropzones match input field background

**Scope:** `ImageDropzone` (shared) + transactions "Invoice Proof" inline copy
**Type:** style
**Author/agent:** you

## What changed

- Dropzone container now carries the same fill/border tokens as every other form control: `border-input` (was `border-border`, keeping `border-dashed`) and a resting `bg-transparent dark:bg-input/30`.
- Applied at both `type="file"` sites in the repo — the shared `ImageDropzone` (covers Category Logo, OG Image, Sub Category Logo, Product Logo) and the not-yet-folded-in inline copy in `EditTransactionForm`.
- Resting fill is a ternary against `dragActive`, not an appended class.

## Why

- Dropzones were the only form field with no background, so they read as a hollow cut-out beside filled `Input`/`Select` controls in dark mode.
- Exact input parity was chosen over a light-mode gray (`bg-muted/50`): inputs themselves have no light-mode fill, so matching them means dark-only. Confirmed with the user before implementing.
- `border-input` rather than `border-border` because the two tokens diverge in dark (`oklch(1 0 0 / 15%)` vs `oklch(0.269 0 0)`) — only `input` actually matches the fields.
- **Ternary, not append:** `cn()` is `twMerge(clsx(...))`, and twMerge keeps both `bg-accent` and `dark:bg-input/30` since they sit in different modifier groups. `.dark .bg-input\/30` then out-specifies bare `.bg-accent`, which would have silently killed the drag-active highlight in dark mode only. Gating the resting fill on `!dragActive` avoids the cascade fight entirely.

## Files touched

- `src/components/common/ImageDropzone.tsx`
- `src/features/transactions/components/EditTransactionForm.tsx`

## Verification

- [ ] Built TDD-first — n/a, token-only style change; tests assert roles/text, never classNames (that's `/qa-audit`'s grep gate)
- [x] `npm run test` passes — 52 files, 358 tests
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean — 0 errors (7 pre-existing `react-hooks/incompatible-library` warnings on TanStack Table, untouched)
- [ ] `/qa-audit` run
- [ ] Renders in **both** light and dark — needs a manual pass: dark should show the faint fill matching the adjacent `Input`; light is unchanged by design (no fill, same as inputs)
- [ ] Reconciled against Figma frame

## Notes / follow-ups

- The `ponytail:` note at `ImageDropzone.tsx:13` still stands: transactions keeps its own inline dropzone. Folding it in needs `caption` made optional plus form wiring — deliberately not done as drive-by churn on a styling change. Do it when that form is next touched for behavior.
- Drag-over state in dark mode is the regression to watch if anyone refactors these classNames — an appended (rather than gated) fill looks fine in light and breaks only in dark.
