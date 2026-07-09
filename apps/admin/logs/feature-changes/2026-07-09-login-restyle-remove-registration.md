# 2026-07-09 — Login screen restyle + Registration removal

> Copy this file to `logs/feature-changes/YYYY-MM-DD-<slug>.md`. History only — durable knowledge goes in agent memory, not here.

**Scope:** auth feature — `LoginPage`, `AuthLayout`, `AuthSideHero`; Registration removed from `auth` and `home`
**Type:** feat / refactor / style
**Author/agent:** you

## What changed
- Stood up test infrastructure from scratch: Vitest + React Testing Library + jsdom, `vitest.config.ts` (separate from `vite.config.ts`, no router-codegen/Tailwind plugins), `src/test/setup.ts`, `src/test/test-utils.tsx` (`renderRoute` helper — builds a real router from the generated route tree + a fresh QueryClient + the app `ThemeProvider`).
- Built TDD-first: wrote `src/features/auth/pages/LoginPage.test.tsx` (12 cases) against the old boilerplate first, confirmed red for content reasons, then implemented until green.
- **Registration removed** (not deferred): deleted `RegisterPage.tsx`, `useRegister.ts`, `routes/_auth/register/`; dropped `registerSchema`/`RegisterFormValues` from `auth.schema.ts`, `register()` from `auth.service.ts`, the `RegisterPage` barrel export, the "Daftar sekarang" link on `LoginPage`, and the stray Register button on `HomePage`. Regenerated `routeTree.gen.ts` via `vite build` — no `/register` entry remains.
- Retoned `LoginPage.tsx`, `AuthLayout.tsx`, `AuthSideHero.tsx` to design-system tokens only: dropped all `slate-*/blue-*/red-*` classes, arbitrary `text-[Npx]` sizes, the gradient hero panel, and the glow box-shadow. Hero panel is now flat `bg-sidebar`; form panel `bg-background` with a `border-l border-border` divider; headings via the `Heading` `variant` prop; primary button uses the shadcn default (already token-correct); error alert is `bg-destructive/10 border-destructive/20 text-destructive`; removed the hardcoded blue focus-ring/checked-state overrides on Input/Checkbox (shadcn defaults handle it). `AuthSideHero` now imports the common `Link` (`href`, not `to`).
- Rewrote all visible auth copy to plain English ("Sign in", "Manage the UDN top-up platform.", "Remember me", etc.) per the English-only product decision. `loginSchema`'s validation messages were left untouched per the task's own instruction (still Indonesian) — the empty-submit test asserts against the existing schema messages, not translated ones.

## Why
- Registration was never a real product surface (invite/seed-only admin) — leftover from the boilerplate template; removing it outright avoids dead routes/dead code rather than leaving a disabled stub.
- The repo had zero test coverage; this establishes the reusable `renderRoute` seam other route-level tests can build on.
- Token-only styling was already mandated by `design_system.md`/`tailwind-styling.md`; the auth screens were the last unconverted boilerplate leftovers.

## Files touched
- `vitest.config.ts` (new), `src/test/setup.ts` (new), `src/test/test-utils.tsx` (new), `src/features/auth/pages/LoginPage.test.tsx` (new)
- `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/layouts/AuthLayout.tsx`, `src/features/auth/components/AuthSideHero.tsx`
- `src/features/auth/index.ts`, `src/features/auth/schemas/auth.schema.ts`, `src/features/auth/services/auth.service.ts`
- `src/features/home/pages/HomePage.tsx`
- `package.json` (added `test`/`test:watch` scripts + devDependencies)
- Deleted: `src/features/auth/pages/RegisterPage.tsx`, `src/features/auth/hooks/useRegister.ts`, `src/routes/_auth/register/`
- Regenerated: `src/routeTree.gen.ts`

## Verification
- [x] `npx tsc --noEmit` clean (also fixed an invalid `ignoreDeprecations: "6.0"` → `"5.0"` in `tsconfig.json`/`tsconfig.app.json`, unrelated pre-existing issue that was blocking a clean typecheck)
- [x] `npm run lint` clean for all files touched by this change (10 pre-existing `react-refresh`/`react-hooks` errors remain in untouched shadcn `src/components/ui/*` primitives — out of scope)
- [x] `npm run test` — 12/12 passing (`src/features/auth/pages/LoginPage.test.tsx`)
- [x] Renders in **both** light and dark — verified by confirming every token class used (`bg-sidebar`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-destructive/10`, `text-destructive`) has both a `:root` and `.dark` definition in `src/index.css`
- [ ] Reconciled against Figma frame — not done this pass (no login-screen node referenced in `design_system.md`; only the Dashboard node is cited)

## Notes / follow-ups
- `src/index.css` still ships the shipped blue-tinted palette (the true-neutral retune from `design_system.md §3.1` is a separate, not-yet-landed task) — since every changed file styles by token name, it will self-correct with no further changes once that retune lands.
- Two Node/jsdom test-infra quirks fixed in `src/test/setup.ts` and worth remembering for future test files in this repo: (1) recent Node ships a native but non-functional `localStorage` that shadows jsdom's, needed an in-memory stub; (2) `@testing-library/react`'s auto-cleanup only registers with a *global* `afterEach`, which this repo intentionally doesn't enable — `afterEach(cleanup)` is wired explicitly in `setup.ts` instead.
- `TanStackRouterDevtools` (mounted unconditionally in `RootLayout`) is mocked to a no-op in tests — it added 10-25s per test in jsdom and has no bearing on assertions.
