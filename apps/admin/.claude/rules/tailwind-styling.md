# Tailwind v4 + shadcn styling (always on) — mirrors `.agents/skills/tailwind-v4-shadcn`

Authoritative: `.agents/context/design_system.md §3, §9`.
- Tokens live in `src/index.css` via `@theme` — **there is no `tailwind.config.*`**. Palette is **true-neutral shadcn `neutral`** + functional `--success` + `--chart-1`(blue)/`--chart-2`(green). Font Inter; `--radius: 0.375rem`.
- **NO raw hex / magic px in JSX — tokens only.** No `slate-`/`zinc-`/`gray-`/`neutral-N` palette classes. Use `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-primary text-primary-foreground`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-success`, `text-destructive`, `bg-chart-1`, `ring`.
- Numbers/tabular content use `tabular-nums`; money via `formatCurrency`.
- `cn()` for conditional classes; `cva` for variants (`TrendPill` up/down, `Button` variants).
- shadcn primitives added via CLI/MCP (`new-york`, base `neutral`, into `src/components/ui/`) then restyled via `className` with our tokens — never the shadcn default palette. Structure via hairline `border-border` + spacing, not shadows (soft shadows for floating layers only).
- **Light + dark, dark default** — verify both.

**Why this matters here:** the shipped `src/index.css` still carries a **blue-tinted** theme; `design_system.md §3.1` has the paste-in true-neutral retune + `--success`. Because components use token *names*, the re-theme is a one-file change — but only if nobody hardcodes a hex or a blue palette class now.
