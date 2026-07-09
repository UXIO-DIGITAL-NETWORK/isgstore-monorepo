# Testing strategy — TDD (always on) — mirrors `.agents/rules/testing-strategy`

- **Test-first, no exceptions:** write the test cases, write the failing tests, then implement until green. Applies to pages/components (`@frontend`) and services/hooks (`@api`) alike.
- Stack: **Vitest + React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) on `jsdom`. Config in `vitest.config.ts` (separate from `vite.config.ts`); no `globals: true` — import `describe`/`it`/`expect` from `"vitest"` explicitly.
- Colocated tests: `Thing.tsx` + `Thing.test.tsx`. Shared harness in `src/test/` (`setup.ts` — jest-dom + `window.matchMedia` stub for `next-themes`; `test-utils.tsx` — `renderRoute(initialPath)` using a real router built from `routeTree.gen.ts` + `createMemoryHistory`, fresh `QueryClientProvider` with `retry: false`, wrapped in `ThemeProvider`). Set up once on first use; reuse for every feature after.
- Test accessible behavior/content (`getByRole`/`getByLabelText`), never implementation classNames/tokens — that belongs to `/qa-audit`'s grep gates.
- Charts/animation: smoke-test only (renders, key labels present); don't force brittle visual assertions.
- Never loosen or delete a test to make it pass — fix the test against the spec instead, and say so.
- `npm run test` (single run) / `npm run test:watch` (dev loop). Both must be clean, alongside `tsc`/`lint`, before `/commit`.

**Why this matters here:** the repo ships with zero test infrastructure today — the harness is built once (first feature that needs it) and every feature after reuses it unchanged. `.claude/agents/qa-auditor.md` and the Definition of Done (`system_architecture.md §9`) both gate on tests existing, being written first, and passing.
