---
name: custom-components
description: UDN admin house style — generated JSX must use the custom primitives in src/components/common (Box, Container, Text, Heading, Link, Image) and shadcn/ui, never raw HTML tags, with monochrome design tokens only. Keeps normal software-engineering behavior.
keep-coding-instructions: true
---

# House Component Style (UDN Admin)

When writing/editing React/TSX in feature/page code, **do not emit raw HTML elements**. Use the polymorphic primitives from `@/components/common`; use shadcn/ui for interactive controls. Monochrome (shadcn `neutral`) tokens only — never raw hex or palette classes.

## Tag -> component mapping (mandatory)

| Raw element | Use instead | Real props (from `src/components/common/*.tsx`) |
| --- | --- | --- |
| `div`,`section`,`article`,`header`,`footer`,`main`,`aside`,`nav`,`ul`,`li` | `<Box as="section">` | `as` (default `"div"`), `className`; spreads native props; no styling of its own. |
| centered / max-width wrapper | `<Container as="section" maxWidth="7xl">` | `as`; `maxWidth` sm\|md\|lg\|xl\|2xl\|3xl\|4xl\|5xl\|6xl\|7xl\|full; `centerContent` (default `false`). |
| `p`,`span` | `<Text as="p" variant="muted">` | `as`: p\|span\|div (default `"p"`); `variant`: default\|lead\|large\|small\|muted (default `"default"`). |
| `h1`–`h6` | `<Heading level={2} variant="section">` | `level` 1–6 (default `1`) or `as="h2"`; `variant`: default\|display\|title\|subtitle\|section (default `"default"`). |
| `a` / router link | `<Link href="/transactions">` | `href` required; `replace` (false), `scroll` (true), `target`, `rel`, `prefetch` (false). Internal via TanStack `RouterLink`; external adds `rel`. |
| `img` | `<Image src alt width height objectFit priority />` | `priority` eager\|lazy (default `"lazy"`), `quality` (default `75`), `placeholder` blur\|empty, `blurDataURL`, `sizes`, `fallback`. Renders a raw `<img>` internally. |
| theme switch | `<ThemeToggle />` | No props. Icon button with an `sr-only` label — reuse this pattern for every icon-only button. |

Import from the barrel: `import { Box, Heading, Text } from "@/components/common";`.

## Interactive controls -> shadcn/ui (not raw)
Buttons, dialogs, sheets, dropdown-menus, inputs, selects, tabs, tables, command palette, tooltips, badges, skeletons, toasts (sonner) come from `@/components/ui/*` (added via `/add-shadcn`), restyled with our tokens. No raw `<button>`/`<input>`/`<table>`.

## Tokens only (monochrome neutral)
Use token utilities, never raw hex or `slate-`/`zinc-`/`gray-` palette classes:
`bg-background` · `bg-card` · `bg-popover` · `bg-muted` · `bg-accent` · `bg-primary text-primary-foreground` · `text-foreground` · `text-muted-foreground` · `border-border` · `text-success` (up) · `text-destructive` (down/danger) · `bg-chart-1` (Revenue) · `bg-chart-2` (Net Income) · `ring` (focus). Font is Inter (`font-sans`); **numbers use `tabular-nums`**, money via `formatCurrency`. Radius `--radius: 0.375rem`; structure via hairline `border-border` + spacing, not shadows.

## Example (follow this shape — token utilities only)

```tsx
import { Box, Heading, Text } from "@/components/common";
import { cn } from "@/lib/utils";

<Box as="section" className={cn("bg-card border border-border rounded-xl p-4")}>
  <Text as="span" variant="muted" className="text-sm">Today's Sales</Text>
  <Heading as="p" className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
    {formatCurrency(value)}
  </Heading>
</Box>
```

(Design tokens come from `@theme` in `src/index.css`. Raw `bg-slate-*`-style palette classes and hex are off-token and fail QA. There are **no motion primitives** in this project.)

## Exceptions (raw element allowed)
- Inside the primitives themselves (`src/components/common/*`) and shadcn output (`src/components/ui/*`).
- Genuinely wrapper-less leaves (`svg`) as a last resort — never a bare `<div>`/`<p>`/`<h*>` in feature code.

Everything else about how you engineer — scoping changes, verifying with `tsc`/lint, minimal diffs — stays exactly as in your default behavior.
