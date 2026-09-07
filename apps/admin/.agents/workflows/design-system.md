# Workflow: /design-system (token + primitive maintenance)

Owner: @frontend (with @qa review). Use when applying the neutral theme, adding/restyling a shadcn primitive, or introducing a new token.

1. Authoritative spec: `context/design_system.md`. Tokens live in `src/index.css` via Tailwind v4 `@theme` — **there is no `tailwind.config.*`**.
2. **Neutral retune (one-time):** replace the shipped blue-tinted `:root`/`.dark` values with the true-neutral block in `design_system.md §3.1`, add `--success`/`--success-foreground`, and register `--color-success*` in `@theme inline` so `bg-success`/`text-success` exist.
3. Adding a primitive: `npx shadcn add <name>` (config in `components.json`: `new-york`, base `neutral`, lands in `src/components/ui/`), then restyle via `className` with our tokens — never the shadcn default palette. Keep radii per `--radius: 0.375rem`; hairline borders over shadows.
4. New token: add to `:root` + `.dark` + `@theme inline`; if it's a `--text-*` font-size token, confirm `cn()`/twMerge classifies it correctly. Document it in `design_system.md` and the frontend memory.
5. Verify in both light and dark; reconcile against Figma. Log the change.

Enforcement mirrors: `.claude/rules/tailwind-styling.md`, `.claude/rules/custom-components.md`.
