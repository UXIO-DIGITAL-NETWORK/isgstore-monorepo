---
name: testing-strategy
description: TDD workflow and the Vitest + React Testing Library harness for this project — write test cases, write failing tests, then implement. Activate at the start of any feature/screen build, and whenever adding a service, hook, or form.
---
# TDD with Vitest + React Testing Library
Authoritative: `context/system_architecture.md §4.11`, `rules/testing-strategy.md`.
- Stack: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Config in `vitest.config.ts` (separate from `vite.config.ts` — just `react()` + the `@` alias + `test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"] }`, no `globals: true`, tests import `describe`/`it`/`expect` from `"vitest"` explicitly).
- Harness: `src/test/setup.ts` (jest-dom matchers + `window.matchMedia` stub) and `src/test/test-utils.tsx` (`renderRoute(initialPath)` — real router from `routeTree.gen.ts` + `createMemoryHistory`, fresh `QueryClientProvider` with `retry: false`, wrapped in `ThemeProvider`). Set this up once, reuse everywhere.
- Tests are colocated: `Thing.tsx` + `Thing.test.tsx`, same folder.
- Loop: write test cases in plain language -> write them as failing tests -> implement to green. Never delete/loosen a test to pass it.
- Test behavior and accessible content (`getByRole`/`getByLabelText`), not implementation classNames — token/hex checks belong to `/qa-audit`'s greps, not unit tests.
- Charts/animation: smoke-test only (renders, key labels present) — don't force brittle visual assertions.
- Verify current Vitest/RTL/Router testing API via the context7 MCP if unsure; these move fast.
