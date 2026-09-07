# 2026-07-10 — Dashboard polish pass: sidebar collapse, trend pill color, table layout

**Scope:** dashboard
**Type:** fix
**Author/agent:** orchestrator (main session)

## What changed

Three targeted fixes on the already-shipped dashboard (`ffab427`), found by the user reviewing screenshots against the live app:

1. **Sidebar collapsed (icon-rail) layout + scrollbar** (`DashboardSidebar.tsx`)
   - The nav's `SidebarContent` scrollbar is now hidden (`[&::-webkit-scrollbar]:hidden [scrollbar-width:none]`) while remaining scrollable.
   - The search bar now reads `useSidebar()`'s `state` and renders a centered icon-only button when collapsed, instead of the full "Search ⌘F" bar overflowing the 48px rail. The global `⌘F` keyboard shortcut still opens the command palette either way.
   - The footer "Subscribe to our newsletter" card is now hidden when collapsed (`group-data-[collapsible=icon]:hidden`), matching the same convention shadcn's own sidebar primitive already uses for `SidebarGroupLabel`/menu-button labels — previously its paragraph text wrapped one word per line down the icon rail.

2. **Trend pill text color/size** (`TrendPill.tsx`)
   - Root cause: the pill's `<Text as="span">` was rendering with `Text`'s default variant (`text-base text-foreground`), which — because these are explicit classes on the child, not inherited — overrode the parent pill's `text-success`/`text-destructive`, so the percentage rendered in the theme's plain foreground color (white in dark mode, black in light) instead of matching the badge tint, and larger than intended.
   - Fix: added `className="text-xs text-current"` to that `Text` element. `cn()` here is `twMerge(clsx(...))`, which recognizes text-color/font-size as Tailwind conflict groups and keeps the later class, so this reliably wins over `Text`'s defaults. Verified via computed styles in the browser: pill text color now exactly equals `--success`/`--destructive` in both themes, font size 12px.

3. **Performance table layout** (`DashboardPage.tsx`)
   - The tabbed Category/Product/User Performance table was a separate full-width row below the chart+side-panel grid. Moved it inside the chart's `lg:col-span-2` column (stacked below `PerformanceChartCard`), so it now sits at the narrower 2/3-width alongside Pending Orders + Recent Log Activity forming an independent right column — matching the target reference layout. Pure JSX relocation within the existing grid; no new components.

## Why
User-reported visual/layout bugs found while reviewing the shipped dashboard against reference screenshots — not new behavior, no new data.

## Files touched
- `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/features/dashboard/components/TrendPill.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`

## Verification
- [x] `npx tsc --noEmit` clean
- [x] `npm run test` passes (41/41, unaffected — grid/DOM restructuring didn't change any queried role/text)
- [x] `npm run lint` — unchanged pre-existing baseline (10 errors in `src/components/ui/*`, 1 documented `DataTable.tsx` warning)
- [x] Grepped changed files clean of `slate-`/`zinc-`/`gray-`/hex
- [x] Verified via chrome-devtools in both light and dark themes, both expanded and collapsed sidebar states: no scrollbar in the nav column, collapsed rail shows icon-only search with no overflow and no visible subscribe card, trend pill computed `color` exactly matches its pill's success/destructive token in both themes, performance table sits under the chart at 2/3 width with Pending Orders/Recent Log Activity as an independent right column.

## Notes
No new tests written — pure visual/layout fixes to already-tested, already-accessible content (no new roles/text/behavior introduced), per `.agents/rules/testing-strategy.md` TDD gating new behavior, not layout polish.
