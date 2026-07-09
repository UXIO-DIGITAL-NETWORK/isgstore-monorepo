---
name: build-crud-feature
description: Invokable — scaffold one feature slice end-to-end (types, mock-backed service, hooks, table+detail+forms). See .agents/skills/build-crud-feature.
user-invocable: true
---
# /build-crud-feature
Follow `.agents/skills/build-crud-feature/SKILL.md` and `.agents/workflows/feature.md`. One feature at a time under `src/features/<f>/`: types (`types/` or `types/models`) -> typed service backed by mock fixtures in `data/` -> TanStack Query hooks -> Zod schemas + components (filter bar, `DataTable`, detail, action dialogs `<Can>`-gated) -> smart page + `index.ts` barrel -> register route in `_protected/<f>/` with `requirePermission`. Tokens only, custom primitives, light+dark, loading/empty/error. Then `/qa-audit`, `/log-change`, update memory.
