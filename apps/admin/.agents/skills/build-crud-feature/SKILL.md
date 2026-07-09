---
name: build-crud-feature
description: Scaffold one feature slice end-to-end — types, mock-backed service, query/mutation hooks, list (data table) + detail + action forms — following feature isolation. Portable mirror of /build-feature.
---
# Build a CRUD/Feature Slice (portable)
For one feature at a time (`workflows/feature.md`). Create under `src/features/<f>/`:
1. **types/** (or `types/models` for global entities) — the typed shape (provisional pending API).
2. **api|services/** — a typed service interface backed by **mock fixtures in `data/`** this phase (swappable later, `system_architecture.md §6`).
3. **hooks/** — TanStack Query `useQuery`/`useMutation` wrapping the service (mutation pattern from `useLogin.ts`).
4. **schemas/** — Zod for filters + action forms; **components/** — filter bar, `DataTable` usage, detail panels, action dialogs (permission-gated via `<Can>`, confirm + toast for destructive).
5. **pages/** — smart page composing the above; **index.ts** — barrel. Register the route in `src/routes/_protected/<f>/` (registry-only + `requirePermission`).
Tokens only, custom primitives, both light+dark, loading/empty/error states. Then `/qa-audit`, `/log-change`, update memory. (Claude Code: `/build-feature <feature>`.)
