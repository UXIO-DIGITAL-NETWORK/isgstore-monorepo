# 2026-07-10 — Sidebar Dark Mode Border Fix

**Scope:** sidebar visual layout in dark mode
**Type:** fix
**Author/agent:** Antigravity

## What changed
- Changed `--border` and `--sidebar-border` color variables in dark mode (`.dark`) from `oklch(1 0 0 / 10%)` (transparent white) to `oklch(0.269 0 0)` (solid dark gray `#212121`).
- Explicitly added `group-data-[side=left]:border-sidebar-border` and `group-data-[side=right]:border-sidebar-border` classes to the `sidebar-container` element in `src/components/ui/sidebar.tsx` for the default non-floating variant.

## Why
- The right border of the sidebar in dark mode was rendering as a solid bright white line. This happened because `border-r` sets the border width but no border color class was specified, causing the browser/Tailwind to default to `currentColor` (which is white for the sidebar's text color in dark mode) or fail to parse/blend the semi-transparent `oklch(1 0 0 / 10%)` correctly.
- Updating `--border` and `--sidebar-border` to the solid `#212121` (`oklch(0.269 0 0)`) follows the design system brief specification exactly ("Border / separator: #212121 (≈ white @ 10%)") and avoids browser/postcss compatibility issues with percentage alpha values in CSS variables.
- Explicitly adding `border-sidebar-border` to the default sidebar border width classes ensures that the sidebar's right border uses the semantic color variable instead of falling back to the global border or inheriting text color (`currentColor`).

## Files touched
- `src/components/ui/sidebar.tsx`
- `src/index.css`

## Verification
- [x] `npm run test` passes (80/80 tests green)
- [x] `npx vite build` compiles clean without warnings or errors
- [x] Colors verified against the design system brief (`design_system.md` §3)

## Notes / follow-ups
- None
