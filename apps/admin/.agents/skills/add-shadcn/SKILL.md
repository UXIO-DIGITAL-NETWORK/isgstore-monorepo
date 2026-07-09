---
name: add-shadcn
description: Add a shadcn/ui primitive and restyle it with our neutral design tokens. Portable mirror of /add-shadcn.
---
# Add a shadcn Component (portable)
`npx shadcn add <component>` (config in `components.json`: `new-york`, base `neutral`, lands in `src/components/ui/`; the shadcn MCP can browse/search first). Then restyle via `className` with our tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-success`, `text-destructive`, `bg-primary`) — never the shadcn default palette. Keep `--radius: 0.375rem`; hairline borders over shadows. Add only components actually used; report files created. (Claude Code: `/add-shadcn <component>`.)
