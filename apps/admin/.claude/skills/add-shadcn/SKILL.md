---
name: add-shadcn
description: Invokable — add a shadcn/ui primitive and restyle with neutral tokens. See .agents/skills/add-shadcn.
user-invocable: true
---
# /add-shadcn
`npx shadcn add <component>` (config `components.json`: `new-york`, base `neutral`, into `src/components/ui/`; shadcn MCP can browse first). Restyle via `className` with our tokens (`bg-card`/`text-foreground`/`text-muted-foreground`/`border-border`/`text-success`/`text-destructive`/`bg-primary`) — never the shadcn default palette. `--radius: 0.375rem`, hairline borders. Add only what's used; report files created.
