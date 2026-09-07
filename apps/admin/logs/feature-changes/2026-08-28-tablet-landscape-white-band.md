# 2026-08-28 — Fix white band across the bottom of the admin shell on tablets

**Scope:** app shell (RootLayout, DashboardLayout, ui/sidebar)
**Type:** fix
**Author/agent:** you

## What changed

- `RootLayout`: `bg-slate-50` -> `bg-background`, `min-h-screen` -> `min-h-svh`. The off-token
  near-white was the actual band: it painted every strip the shell did not cover.
- `DashboardLayout`: `<SidebarProvider className="bg-sidebar">` so the sidebar column keeps the
  sidebar tone for the full document height, not just the fixed sidebar's viewport slice.
- `ui/sidebar`: fixed sidebar container `h-svh` -> `h-dvh`, so it tracks the visible viewport
  when a mobile browser collapses its URL bar instead of stopping ~80px short.
- `index.css`: `color-scheme: light` / `html.dark { color-scheme: dark }` in `@layer base`, so
  the browser's own scrollbars and overscroll canvas follow the theme instead of defaulting white.

## Why

- On a tablet in landscape (bug.mp4) the page is taller than the viewport, so Chrome collapses
  its URL bar. `100svh` is measured with that bar *shown*, so the `h-svh` fixed sidebar — and the
  `min-h-svh` shell wrapper — end short of what is now visible. The uncovered strip fell through
  to `RootLayout`, which was painted `bg-slate-50`: a white band across the bottom, in dark theme.
- Fixing only the geometry would still leave an off-token white ready to show through anywhere
  else, so both the cover (`dvh`, `bg-sidebar`) and the ground (`bg-background`) were fixed.
- `min-h-svh` is kept on the shell wrapper on purpose: a `dvh` *min-height* would reflow the
  whole document every time the URL bar animates.

## Files touched

- `src/components/layouts/RootLayout.tsx`
- `src/features/dashboard/layouts/DashboardLayout.tsx`
- `src/components/ui/sidebar.tsx`
- `src/index.css`

## Verification

- [x] Reproduced and re-checked in Chrome DevTools with the collapsed-URL-bar geometry simulated
      (`.h-svh` forced to `100vh - 80px`), scrolled to the bottom of `/admin/dashboard`:
      `screenshots/before-tablet-landscape-1024x768.png` vs `after-*.png`
      (1024x768, 1280x800, 820x1180, 390x844, 1440x900, plus light theme).
- [x] Sidebar bottom == `window.innerHeight` at every size checked; root background reads
      `oklch(0.145 0 0)` in dark / `oklch(1 0 0)` in light.
- [x] `npm run test` passes
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean
- [ ] `/qa-audit` not run (CSS-only fix)
- [x] Renders in **both** light and dark
- [ ] No Figma frame for the shell background

## Notes / follow-ups

- No test added: the change is class-level styling, and `testing-strategy` puts token/className
  assertions in `/qa-audit`'s grep gates, not in RTL tests.
- `features/auth` is still deliberately light-only (`bg-white`, `slate-*` in `AuthLayout` /
  `LoginPage`); left as designed, but it is the remaining off-token surface if the login screen
  ever has to follow the theme.
