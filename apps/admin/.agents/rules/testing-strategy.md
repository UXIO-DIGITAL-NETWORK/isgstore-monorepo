# Testing Strategy (TDD, mandatory)

Every feature is built **test-first**: write the test cases, write the failing tests, then implement until green. This applies to `@frontend` (pages/components) and `@api` (services/hooks) alike — not just UI.

## Stack
**Vitest + React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) on `jsdom`. Vitest is native to Vite (shares the `@` alias and dev-server speed with no separate config duplication); RTL's `getByRole`/`getByLabelText` queries double as an accessibility check, since a test that can't find an element by its accessible role/label is telling you the markup isn't accessible either — this reinforces `rules/accessibility.md` for free.

## Conventions
- **Colocated tests:** `ComponentName.test.tsx` next to the file it tests (e.g. `features/auth/pages/LoginPage.tsx` + `LoginPage.test.tsx`) — keeps tests inside the feature boundary, consistent with `rules/feature-isolation.md`.
- **Shared harness in `src/test/`:** `setup.ts` (extends `expect` via jest-dom; stubs `window.matchMedia`, which `next-themes`' `ThemeProvider` calls and `jsdom` doesn't implement) and `test-utils.tsx` (a `renderRoute(initialPath)` helper that builds a **real** router from `routeTree.gen.ts` + `createMemoryHistory`, wrapped in a fresh `QueryClientProvider` — mutations/queries `retry: false` — and the app's `ThemeProvider`). Route-level tests exercise the actual route tree and guards, not a shallow stand-in. Reuse this helper for every feature; don't hand-roll a new render wrapper per test file. Router/Query test APIs move fast — check the context7 MCP for current syntax rather than assuming.
- Scripts: `npm run test` (single run) / `npm run test:watch` (dev loop). Add both to `package.json` the first time this is set up; don't recreate the harness if it already exists.

## The loop (per feature/screen, inside `/build-feature`)
1. Define the test cases in plain language first, grounded in the PRD spec for that screen: what must be reachable, what content/labels must exist, what interactions must work.
2. Write those as actual failing tests. Confirm they fail for the **right** reason (missing content/behavior) — not a setup crash.
3. Implement until every case is green.
4. Never loosen or delete a test to make it pass. If a test turns out to be wrong against the spec, fix the test and say so — don't silently relax it.

## Scope — what to test, what not to
- Every new page/screen: a reachability + content test at minimum (renders via the real route, key accessible content/labels present, no leftover placeholder copy).
- Every service/hook: a test asserting its typed contract/shape (mock fixture matches the type, pagination params map correctly).
- Every form: a validation-behavior test (empty submit surfaces errors; valid submit calls the mutation).
- **Don't** assert exact className/token strings in tests — that's `/qa-audit`'s grep gate, not a unit test's job; test behavior and accessible content.
- Charts/animation are smoke-tested at most (renders without crashing, key labels/legend text present) — deep visual assertions with RTL are brittle and low-value. This is a deliberate, narrow exception, not a loophole to skip testing everything else.

**Why this matters here:** the codebase ships with zero test infrastructure today, so the harness above is set up once (first feature that needs it) and reused by every feature after. `qa.md` and the Definition of Done (`system_architecture.md §9`) both gate on this — a feature isn't done until its tests exist, were written first, and pass.
