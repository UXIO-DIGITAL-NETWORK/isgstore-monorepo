---
name: build-crud-feature
description: Scaffold one feature slice end-to-end — types, mock-backed service, query/mutation hooks, list (data table) + detail + action forms — following feature isolation. Portable mirror of /build-feature.
---
# Build a CRUD/Feature Slice (portable, TDD-first)
For one feature at a time (`workflows/feature.md`), built **test-first** at every layer (`rules/testing-strategy.md`) — write the failing test, then the minimum code to pass it, before moving to the next layer. Create under `src/features/<f>/`:
1. **types/** (or `types/models` for global entities) — the typed shape (provisional pending API).
2. **api|services/** — write a test asserting the service's typed contract/shape first, confirm it fails, then implement a typed service interface backed by **mock fixtures in `data/`** this phase (swappable later, `system_architecture.md §6`).
3. **hooks/** — TanStack Query `useQuery`/`useMutation` wrapping the service (mutation pattern from `useLogin.ts`).
4. **schemas/** — Zod for filters + action forms; write the validation-behavior test first (empty submit surfaces errors, valid submit calls the mutation), then wire the form. **components/** — filter bar, `DataTable` usage, detail panels, action dialogs (permission-gated via `<Can>`, confirm + toast for destructive).
5. **pages/** — define the page's test cases in plain language (reachability, required content/labels, key interactions) against the PRD spec, write them as failing tests using `renderRoute` from `src/test/test-utils.tsx`, confirm they fail for the right reason, then build the smart page composing the above until green. **index.ts** — barrel. Register the route in `src/routes/_protected/<f>/` (registry-only + `requirePermission`).
Tokens only, custom primitives, both light+dark, loading/empty/error states. Never loosen/delete a test to pass it — fix the test against the spec instead. Then `/qa-audit` (runs `npm run test` too), `/log-change`, update memory. (Claude Code: `/build-feature <feature>`.)
