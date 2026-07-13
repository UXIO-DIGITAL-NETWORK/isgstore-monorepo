# 2026-07-14 — Transaction tabs: line/underline style

**Scope:** transactions (`TransactionsLayout` — Automatic/Manual tab shell)
**Type:** style
**Author/agent:** you

## What changed
- `TransactionsLayout` now passes `variant="line"` to the shared `TabsList` primitive instead of the default pill/segmented style, matching the reference underline-tab design (bold active label + bottom line, muted inactive label, transparent background).

## Why
- `src/components/ui/tabs.tsx` already ships a token-only `line` variant (`data-[variant=line]`) that was unused; no new CSS/markup needed, just switching the variant on the existing usage.

## Files touched
- `src/features/transactions/layouts/TransactionsLayout.tsx`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green — N/A, pure style/variant swap on an existing shadcn primitive, no behavior change; existing `transactions-routes.test.tsx` / `AutomaticTransactionsPage.test.tsx` assert accessible tab role/name, unaffected and still green (test-strategy explicitly excludes asserting classNames/tokens).
- [x] `npm run test` passes (26/26, transactions suite)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 5 pre-existing unrelated TanStack Table compiler warnings)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Renders in **both** light and dark — verified via Chrome DevTools MCP screenshots against the provided reference image
- [ ] Reconciled against Figma frame (node id: <...>) — not checked against Figma; driven directly from a user-supplied reference screenshot instead

## Notes / follow-ups
- None — single-prop change, no open decisions.
