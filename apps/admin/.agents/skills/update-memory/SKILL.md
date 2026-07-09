---
name: update-memory
description: Refresh an agent's MEMORY.md with new durable knowledge (patterns, decisions, file locations, reusable utils). Portable mirror of /update-memory.
---
# Update Memory (portable)
After any change that introduces/revises a pattern, decision, file location, or reusable util, update `.claude/agent-memory/<agent>/MEMORY.md` (`rules/memory-context.md`). It is **knowledge, not a changelog** (history -> `logs/`). Record: what the pattern/util is, where it lives, and when to reuse it. Remove superseded facts. Keep it tight — the first ~200 lines are auto-injected into the subagent. (Claude Code: `/update-memory`.)
