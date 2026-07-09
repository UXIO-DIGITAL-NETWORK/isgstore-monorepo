---
name: discover-tooling
description: Search the internet for Claude Code skills and MCP servers relevant to this project's stack, evaluate them, and propose the best fits (propose only, never auto-install).
---
# Discover Skills & MCP (portable)
Using web search/fetch, find community skills and MCP servers that fit this stack (React 19, Vite, TanStack Router/Query/Table, Tailwind v4, shadcn/ui, Zustand, RHF+Zod, Axios, TypeScript strict; separate Laravel API).
- **Skills:** awesome-claude-code lists, plugin hubs, topic skills (tailwind v4, tanstack, data-table, zod). Prefer official/well-maintained.
- **MCP:** registries for useful servers — up-to-date library docs (Context7), design handoff (Figma), visual/perf checks (Chrome DevTools/Playwright). Optional later: a MySQL / OpenAPI server once the backend + schema exist.
- Evaluate fit + maintenance/trust; discard unmaintained/redundant ones.
- **Propose, don't install:** present a ranked table (name · type · fit · how to add). On approval, skills → `.claude/skills/`, MCP → `.mcp.json`. Never commit secrets. Log additions + record durable choices in memory.
Already adopted (don't re-propose): MCP `context7`, `shadcn`, `chrome-devtools`, `figma` (`.mcp.json`); vendored skill `impeccable` in `.claude/skills/`. (Claude Code: `/discover-tooling`.)
