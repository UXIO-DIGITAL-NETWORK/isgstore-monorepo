# Agent memory as project knowledge (portable rule)

`.claude/agent-memory/<agent>/MEMORY.md` (project scope, committed) holds durable knowledge about this project — real folder layout, the custom-component API, conventions, decisions, and DRY patterns. **Read it before building; update it after any change** that introduces or revises a pattern, decision, file location, or reusable util. It is knowledge, **not** a changelog (history lives in `logs/`). Reuse what memory documents instead of duplicating it. (Claude Code: `/update-memory`.)

**Why this matters here:** the three memory sets — `frontend-engineer/` (shell, common-primitive API, tokens, table/card patterns), `api-integrator/` (service→hook pattern, `ApiResponse<T>`/`PaginatedResponse<T>`, the mock-swap seam), `qa-auditor/` (recurring grep findings, DoD) — are the live source of the conventions that keep three sibling features consistent. Skill mirror: `skills/update-memory`.
