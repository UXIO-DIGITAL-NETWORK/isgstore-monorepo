# 2026-07-14 — Sidebar: rounder search bar, nav items, Subscribe button

**Scope:** dashboard (`DashboardSidebar` — search box, nav menu items, footer Subscribe CTA)
**Type:** style
**Author/agent:** you

## What changed
- Search box (both collapsed icon-button and expanded variants), the sidebar nav item buttons (shared active/hover styling), and the footer "Subscribe" button all bumped from `rounded-md` (4px) to `rounded-lg` (6px), matching the rounding already used by the adjacent footer card and header logo mark in the same file.

## Why
- User asked for the sidebar's Subscribe button, active/hover nav items, and search bar to look more rounded. `rounded-lg` was already present elsewhere in `DashboardSidebar.tsx` (footer card, logo box), so reusing it keeps the rounding consistent instead of introducing a new radius step.

## Files touched
- `src/features/dashboard/components/DashboardSidebar.tsx`

## Verification
- [x] Built TDD-first: N/A — pure Tailwind radius-class swap on existing elements, no behavior change; testing-strategy explicitly excludes asserting classNames/tokens in tests.
- [x] `npm run test` passes (23/23, full suite unaffected)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; 5 pre-existing unrelated TanStack Table compiler warnings)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Renders in **both** light and dark — verified via Chrome DevTools MCP screenshots (active/hover nav state, search box, Subscribe button)
- [ ] Reconciled against Figma frame (node id: <...>) — not checked against Figma; driven directly from user request

## Notes / follow-ups
- None — single token-value swap on four elements, no open decisions.
