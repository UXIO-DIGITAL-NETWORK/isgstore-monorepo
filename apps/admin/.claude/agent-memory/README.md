# Agent memory (project scope, committed)
`.claude/agent-memory/<agent>/MEMORY.md` is durable **knowledge about this project** for each subagent (the first ~200 lines are auto-injected into that subagent on invocation). It exists so generated code stays clean, DRY, and on-context. It is knowledge, **not** a changelog — per-change history lives in `logs/feature-changes/`.
- `project` scope -> committed here (VCS-tracked). Local-only notes go in `.claude/agent-memory-local/` (gitignored).
- Keep each MEMORY.md updated whenever a pattern, decision, file location, or reusable util changes (`/update-memory` or edit directly).
- Known Claude Code caveat: subagent auto-write of MEMORY.md can be unreliable — each subagent lists `Write, Edit` in its `tools` and treats updating memory as an explicit step.
- If a `MEMORY.md` grows past ~200 lines / the auto-injected read limit, split it: keep `MEMORY.md` a one-line-per-entry index, move full detail into `<agent>/topics/<name>.md` files (not auto-injected — read the relevant one explicitly when it's on-topic). Precedent: `frontend-engineer/topics/`.
