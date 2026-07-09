# Agent memory as project knowledge (always on) — mirrors `.agents/rules/memory-context`

`.claude/agent-memory/<agent>/MEMORY.md` (project scope, committed) holds durable knowledge — real layout, the custom-component API, conventions, decisions, DRY patterns. **Read it before building; update it after** any change that introduces/revises a pattern, decision, location, or reusable util. Knowledge, **not** a changelog (history -> `logs/`). Command: `/update-memory`.

**Why this matters here:** the three memory sets (`frontend-engineer`, `api-integrator`, `qa-auditor`) are the live source of the conventions that keep three sibling features consistent — reuse what they document instead of re-deriving it.
