---
name: tailwind-v4-shadcn
description: Tailwind v4 (@theme tokens, no config file) + shadcn/ui overrides for this monochrome admin. Activate when styling components or editing src/index.css.
---
# Tailwind v4 + shadcn (monochrome neutral)
Authoritative: `context/design_system.md §3, §9`.
## Tokens (no tailwind.config.*)
All tokens live in `src/index.css` via `@import "tailwindcss";` + `@custom-variant dark` + `:root`/`.dark` + `@theme inline`. Palette is **true-neutral shadcn `neutral`** (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary` = light-in-dark, ...) plus functional `--success`/`--success-foreground` and `--chart-1` (blue) / `--chart-2` (green). Font `--font-sans: Inter`. Radius `--radius: 0.375rem`.
> The shipped `src/index.css` still carries a **blue-tinted** theme. Apply the true-neutral retune + `--success` from `design_system.md §3.1`; register `--color-success*` in `@theme inline`. Because components use token *names*, this is a one-file change.
## Rules
- NO raw hex/magic px in JSX — tokens only; no `slate-`/`zinc-`/`gray-` palette classes. Numbers use `tabular-nums`.
- `cn()` (tailwind-merge + clsx) for conditional classes; `cva` for variants (`TrendPill` up/down, `Button` variants).
- shadcn primitives added via CLI/MCP (`new-york`, base `neutral`, into `src/components/ui/`) then restyled via `className` with our tokens — never the shadcn default palette.
- Structure via hairline borders (`border-border`) + spacing, not shadows. Dark is default; keep light parity.
Enforcement mirror: `.claude/rules/tailwind-styling.md`.
