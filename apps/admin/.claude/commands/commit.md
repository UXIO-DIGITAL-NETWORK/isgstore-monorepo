---
description: Stage changes and write a Conventional Commit that follows .agents/rules/commit-rules.md.
argument-hint: [optional scope hint]
---
Review the current diff:

!`git status --short && git diff --stat`

Create ONE logical Conventional Commit following `.agents/rules/commit-rules.md`:
- Format `type(scope): summary` (imperative, ≤72 chars, no trailing period). Types include `a11y` alongside the standard set.
- Scope = the module touched (e.g. `dashboard`, `financial`, `transactions`, `setup`, `auth`). Use "$ARGUMENTS" as a hint if provided. Examples: `feat(dashboard): stat cards + trend pill + monthly chart`, `feat(transactions): server-side table + row actions`, `chore(setup): neutral @theme retune + success token`.
- Ensure `npx tsc --noEmit`, `npm run lint`, and `npm run test` all pass before committing.
- A feature commit includes the tests that drove it (`*.test.tsx`) — code and its tests land together, never split across commits.
- Do NOT stage `.env*`, `.artifacts/`, or secrets. Include the matching `logs/feature-changes/` entry (and any memory update) in the same commit as the change it documents (`.claude/rules/logging.md`).
Stage the relevant files and commit. Show the final commit message.
