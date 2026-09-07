---
description: Refresh an agent's MEMORY.md with new durable knowledge (patterns, decisions, locations, utils).
argument-hint: <agent> (frontend-engineer | api-integrator | qa-auditor)
---
Update `.claude/agent-memory/"$ARGUMENTS"/MEMORY.md` per `.claude/rules/memory-context.md`:
- Record new/changed patterns, decisions, file locations, or reusable utils — **knowledge, not a changelog** (history -> `logs/`).
- Remove superseded facts. Keep it tight (first ~200 lines auto-inject into the subagent). Note reuse guidance so future work doesn't duplicate.
