# Commit Rules

- **Conventional Commits:** `type(scope): summary` — types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `perf`, `test`, `a11y`.
- **One logical unit per commit** — per feature/screen, per primitive, or per config step. Never one giant "build everything" commit.
- **Scope = the module touched**, e.g. `feat(transactions): server-side table + filters`, `feat(dashboard): stat cards + trend pill`, `chore(setup): neutral @theme tokens + success token`.
- **Summary:** imperative, ≤ 72 chars, no trailing period. **Body (optional):** why + notable decisions.
- **Green before commit:** `npx tsc -b --force` + `npm run lint` + `npm run test` must all pass — don't commit broken builds or failing tests.
- A feature commit includes its own tests (`*.test.tsx`) — code and the tests that drove it land together, never in a follow-up commit.
- **Never commit:** `.env*`, `node_modules`, `.artifacts/`, secrets, or an unresolved `routeTree.gen.ts`.
- Commit the matching `logs/feature-changes/` entry (and any memory update) **in the same commit** as the change it documents (`logging.md`).

**Why this matters here:** per-module commits are what make the one-feature-per-approval-gate workflow (`workflows/feature.md`) reviewable, and they keep the decision trail (`logs/`) aligned with git as the codebase grows from `auth` to the full admin.
