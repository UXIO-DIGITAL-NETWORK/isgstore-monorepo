# Accessibility & Performance

- **Contrast:** body text ≥ 4.5:1, large text ≥ 3:1 — in both light and dark. Muted text still meets contrast; don't use light grey "for elegance."
- **Keyboard:** every interactive control (tables, row-action menus, dialogs, command palette, filters) is fully keyboard-operable with a **visible focus ring** (`ring`).
- **Semantics:** landmark elements, labelled form controls (RHF + shadcn `Field`), `alt` text on images, `aria-*` on icon-only buttons (icon buttons carry an `sr-only` label — see `ThemeToggle`).
- **Overlays:** dialogs/sheets trap focus and restore it on close; use the shadcn primitives (already handle this) rather than hand-rolled overlays.
- **Tables:** provide explicit loading (skeleton), empty, and error states — never a blank grid.
- **Performance:** server-side pagination for large lists (no client-paginating thousands of rows); lazy-load images; memoize expensive table/chart renders; keep bundle lean (add shadcn primitives only when used).

**Why this matters here:** this is a data-dense tool used all day — dense tables, dialogs, and the command palette are the primary surfaces, so keyboard + focus + table states are the highest-value a11y wins. The design is monochrome, so contrast discipline (not color) carries meaning and legibility.
