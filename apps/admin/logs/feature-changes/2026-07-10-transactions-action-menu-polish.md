# 2026-07-10 — Row action menu icons + Edit modal overlay polish

**Scope:** transactions (row action menu, Edit Transaction modal) — small follow-up polish on top of the already-built and twice-polished feature
**Type:** style
**Author/agent:** you (main thread)

## What changed

1. **Row action menu icons** (`RowActionMenu.tsx`) — added a lucide icon to each of the 7 items (`History` Activity Log, `Upload` Resend Callback, `RotateCw` Retry Invoice, `Receipt` View Invoice, `Eye` Transaction Detail, `Pencil` Edit Invoice, `Trash2` Delete), matching the reference image exactly. The menu card itself bumped to `rounded-2xl` (scoped via `className` on this `DropdownMenuContent` instance, not the shared primitive).
2. **Edit Transaction modal overlay** — darker (`bg-black/50` → `bg-black/70`) and an explicit `duration-300` transition, scoped to this one dialog only.

## Why

- Icons and rounding matched 1:1 against the new reference image — no ambiguity, implemented directly without new open questions.
- The overlay change needed a small, additive `overlayClassName` prop on the shared `DialogContent` (`src/components/ui/dialog.tsx`) since it didn't previously expose a way to override the overlay's className per-instance — same scoping pattern as the `Table` `containerClassName` and `Button`/`TableRow` `forwardRef` additions from the prior polish pass (backward-compatible, existing dialogs — e.g. `DeleteConfirmDialog` — are unaffected).

## Files touched

- `src/features/transactions/components/RowActionMenu.tsx`
- `src/features/transactions/components/EditTransactionDialog.tsx`
- `src/components/ui/dialog.tsx` (new optional `overlayClassName` prop on `DialogContent`, backward-compatible)

## Verification

- [x] `npm run test` passes (80/80, whole suite — no new tests needed, this is a styling-only change with no new interactive behavior; menu item accessible names are unchanged, icons are decorative)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (same 10 pre-existing errors in untouched files, same 3 expected warnings)
- [x] Grepped changed files for raw hex / off-token palette classes — empty
- [x] Verified via chrome-devtools: menu icons + rounding match the reference exactly; Edit modal overlay is visibly darker; Escape/Cancel still close the dialog correctly

## Notes / follow-ups

- None — this was a small, unambiguous visual-only change.
