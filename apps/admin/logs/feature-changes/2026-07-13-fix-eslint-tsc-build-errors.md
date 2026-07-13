# 2026-07-13 — Fix ESLint + tsc build errors blocking GitHub Actions

**Scope:** setup — build/lint config and two vendored/generated files
**Type:** fix
**Author/agent:** you (main)

## What changed
- **`eslint.config.js`:** added a scoped override disabling `react-refresh/only-export-components`
  for `src/components/ui/**/*.{ts,tsx}`. `CLAUDE.md` and `.claude/rules/react-typescript.md`
  already document this rule as "intentionally off" for shadcn output (which exports variant
  helpers/hooks alongside components), but the override was never wired into the config — it was
  firing as an error on 7 files (`badge`, `button`, `button-group`, `combobox`,
  `navigation-menu`, `tabs`, `toggle`).
- **`src/components/ui/combobox.tsx`:** removed the unused `children` destructure from
  `ComboboxChipsInput` (`@typescript-eslint/no-unused-vars`).
- **`src/features/transactions/pages/AutomaticTransactionsPage.tsx` and
  `ManualTransactionsPage.tsx`:** fixed `(sorting[0].desc ? "desc" : "asc") as const` — a `const`
  assertion on a ternary *expression*, which `tsc -b` rejects (TS1355: const assertions only
  apply to literals). Moved `as const` onto each branch individually:
  `sorting[0].desc ? ("desc" as const) : ("asc" as const)`.

## Why
- `npm run lint` (`eslint .`) reported 8 errors, all under `src/components/ui/**`, that CI's
  `eslint .` step would fail on — invisible on `npm run dev`, which never runs ESLint.
- `npm run build` runs `tsc -b && vite build`. `tsc -b` (build/project-reference mode) enforces
  TS1355 even though plain `npx tsc --noEmit` on this project did not surface it — so the build
  script was failing independently of ESLint, on 2 pre-existing sites. Both would break the
  GitHub Actions build the user asked to unblock, so both are fixed here even though the request
  named ESLint specifically.
- Scope note: 5 pre-existing `react-hooks/incompatible-library` **warnings** (React Compiler
  advisories on TanStack Table's `useReactTable()` / React Hook Form's `watch()` in
  `CategoriesTable`, `AddCategoryPage`, `DataTable`, `EditTransactionDialog`,
  `TransactionsTable`) were left as-is per explicit scope decision — they don't affect `eslint .`'s
  exit code.

## Files touched
- `eslint.config.js`
- `src/components/ui/combobox.tsx`
- `src/features/transactions/pages/AutomaticTransactionsPage.tsx`
- `src/features/transactions/pages/ManualTransactionsPage.tsx`

## Verification
- [x] `npm run lint` — 0 errors (5 pre-existing warnings remain, expected)
- [x] `npx tsc --noEmit` — clean
- [x] `npm run build` (`tsc -b && vite build`) — succeeds, matching CI
- [x] `npm run test` — 20 files / 122 tests passing
- [ ] `/qa-audit` not run (config/build-tooling fix, no UI surface to audit)

## Notes / follow-ups
- None — this closes out the CI build-breaker; no deferred work.
