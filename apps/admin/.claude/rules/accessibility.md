# Accessibility & performance (always on) — mirrors `.agents/rules/accessibility`

- Contrast: body ≥ 4.5:1, large text ≥ 3:1, in **both** light and dark (monochrome means contrast carries legibility).
- Keyboard: tables, row-action menus, dialogs, command palette, and filters fully operable; **visible focus ring** (`ring`).
- Semantics: landmarks, labelled controls (shadcn `Field`), `alt` text, `sr-only` labels on icon-only buttons (see `ThemeToggle`). Overlays trap + restore focus (use shadcn primitives).
- Tables always have loading (skeleton) / empty / error states — never a blank grid.
- Performance: server-side pagination for large lists; lazy images; memoize heavy table/chart renders; add shadcn primitives only when used.

**Why this matters here:** dense tables, dialogs, and the command palette are the primary all-day surfaces, so keyboard + focus + table states are the highest-value wins.
