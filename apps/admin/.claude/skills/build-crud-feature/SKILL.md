---
name: build-crud-feature
description: Invokable — scaffold one feature slice end-to-end, TDD-first (types, mock-backed service, hooks, table+detail+forms, tests before each layer). See .agents/skills/build-crud-feature.
user-invocable: true
---
# /build-crud-feature
Follow `.agents/skills/build-crud-feature/SKILL.md`, `.agents/workflows/feature.md`, and `.agents/rules/testing-strategy.md`. One feature at a time under `src/features/<f>/`, test-first at every layer: types (`types/` or `types/models`) -> service test (contract/shape) then typed service backed by mock fixtures in `data/` -> TanStack Query hooks -> Zod schemas + form validation test -> page test cases (reachability/content, via `renderRoute`) written failing first -> components (filter bar, `DataTable`, detail, action dialogs `<Can>`-gated) + smart page implemented to green -> `index.ts` barrel -> register route in `_protected/<f>/` with `requirePermission`. Tokens only, custom primitives, light+dark, loading/empty/error. Never loosen/delete a test to pass it. Then `/qa-audit` (includes `npm run test`), `/log-change`, update memory.
