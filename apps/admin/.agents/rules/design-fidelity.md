# Design Fidelity (monochrome, tokens, Figma)

- Palette is **monochrome shadcn `neutral`** (pure black/white/grey). Color is functional only: `text-success` (up), `text-destructive` (down/danger), `chart-1`/`chart-2` (chart series). See `design_system.md §3`.
- **Tokens only — no raw hex** in JSX (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-success`, `bg-chart-1`, …). No `slate-*`/`zinc-*` palette classes.
- **Inter for everything**; numeric/tabular content uses `tabular-nums` (money via the shared `formatCurrency` util). No IBM Plex / DM Sans / JetBrains Mono.
- **Light + dark, dark is default** — every screen must render correctly in both.
- Structure comes from **borders + spacing + weight**, not shadows or glow. Reserve soft shadows for floating layers (dropdown/popover/dialog) only. No neon/colored shadows.
- **Figma is binding for pixels** — before finishing a screen, pull the exact frame/tokens from file `l7izBcDr0PtS2FUdMdHFk3` (Dashboard node `22011-2008`, components `22078-1614`) via the Figma MCP and reconcile.

**Why this matters here:** the shipped `src/index.css` currently carries a **blue-tinted** shadcn theme; `design_system.md §3.1` provides the ready-to-paste true-neutral retune + the new `--success` token. Until that lands, style by token *name* so the retune is a one-file change. Enforcement mirror: `.claude/rules/tailwind-styling.md`.
