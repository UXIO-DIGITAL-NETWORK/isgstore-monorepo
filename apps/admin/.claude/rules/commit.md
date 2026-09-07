# Commit rules (always on) — mirrors `.agents/rules/commit-rules`

- Conventional Commits `type(scope): summary` — types incl. `a11y`. One logical unit per commit; scope = module (`dashboard`/`financial`/`transactions`/`setup`/`auth`). Imperative, ≤72 chars, no trailing period.
- Green before commit: `npx tsc -b --force` + `npm run lint` + `npm run test` pass. Never commit `.env*`, `node_modules`, `.artifacts/`, secrets, or an unresolved `routeTree.gen.ts`.
- A feature commit includes the tests that drove it (`*.test.tsx`) — code and its tests land together.
- Commit the matching `logs/feature-changes/` entry (+ any memory update) with the change it documents. Command: `/commit`.

**Why this matters here:** per-module commits make the one-feature-per-approval-gate workflow reviewable and keep the decision trail aligned with git.
