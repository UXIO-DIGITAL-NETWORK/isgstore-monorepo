# Custom component API (always on) — the `common/` primitives

Feature/page TSX uses the polymorphic primitives in `@/components/common`, **never bare HTML tags** (`div`/`p`/`span`/`h*`/`a`/`img`). Interactive controls with no wrapper -> shadcn/ui (`Button`, `Dialog`, `Input`, …), not raw `<button>`/`<input>`. Output styles don't reach subagents, so subagents follow this file.

| Raw element | Use instead | Real props (from `src/components/common/*.tsx`) |
| --- | --- | --- |
| `div`,`section`,`header`,`footer`,`nav`,`ul`,`li` | `<Box as="section">` | `as` (default `"div"`), `className`; spreads native props; no styling of its own. |
| centered / max-width wrapper | `<Container as="section" maxWidth="7xl">` | `as`; `maxWidth` sm\|md\|lg\|xl\|2xl\|3xl\|4xl\|5xl\|6xl\|7xl\|full; `centerContent` (default `false`). |
| `p`,`span` | `<Text as="p" variant="muted">` | `as`: p\|span\|div (default `"p"`); `variant`: default\|lead\|large\|small\|muted (default `"default"`) — variants map to token color/size classes. |
| `h1`–`h6` | `<Heading level={2} variant="section">` | `level` 1–6 (default `1`) or `as="h2"`; `variant`: default\|display\|title\|subtitle\|section (default `"default"`). |
| `a` / router link | `<Link href="/transactions">` | `href` required; `replace` (false), `scroll` (true), `target`, `rel`, `prefetch` (false). Internal via TanStack `RouterLink`; external adds `rel`. |
| `img` | `<Image src alt width height objectFit priority />` | `priority` eager\|lazy (default `"lazy"`), `quality` (default `75`), `placeholder` blur\|empty, `blurDataURL`, `sizes`, `fallback`. Renders a raw `<img>` internally. |
| theme switch | `<ThemeToggle />` | No props. Icon button with an `sr-only` label — copy this pattern for all icon-only buttons. |

Import from the barrel: `import { Box, Heading, Text } from "@/components/common";`.

**Tokens only inside these** — e.g. `<Box as="section" className={cn("bg-card border border-border rounded-xl p-4")}>`. Never raw palette classes; monochrome, `tabular-nums` on numbers.

## Exceptions (raw element allowed)
- Inside the primitives themselves (`src/components/common/*`) and shadcn output (`src/components/ui/*`).
- Genuinely wrapper-less leaves (`svg`, an `<input>` when not using shadcn) as a last resort — never a bare `<div>`/`<p>`/`<h*>` in feature code.

Everything else about how you engineer — scoping changes, verifying with `tsc`/lint, minimal diffs — stays as your default behavior.
