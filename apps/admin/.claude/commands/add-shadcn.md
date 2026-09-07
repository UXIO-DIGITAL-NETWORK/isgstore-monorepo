---
description: Add a shadcn/ui component and restyle it with our neutral design tokens.
argument-hint: <component> (e.g. table, dialog, command, badge)
---
Add the shadcn component "$ARGUMENTS" (via `npx shadcn add` — config in `components.json`: style `new-york`, base color `neutral`, lands in `src/components/ui/`; the shadcn MCP can search/browse first), then restyle per `.claude/rules/tailwind-styling.md`:
- Override via `className` with our tokens (`bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-success`, `text-destructive`, `bg-primary text-primary-foreground`) — never the shadcn default palette.
- Keep `--radius: 0.375rem`; hairline borders over shadows; monochrome (color only for trend/chart/destructive). Numbers use `tabular-nums`.
- Add only components actually used by the current feature. Report the file(s) created/edited.
