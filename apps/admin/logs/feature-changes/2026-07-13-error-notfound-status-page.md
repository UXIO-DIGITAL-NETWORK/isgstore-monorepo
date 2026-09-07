# 2026-07-13 — Shared error/not-found status page

**Scope:** router root (`src/routes/__root.tsx`) — 404 not-found and 503 error-boundary
**Type:** feat
**Author/agent:** you

## What changed
- Added `StatusPage` (`src/components/common/StatusPage.tsx`), a shared full-screen boundary component (illustration + code + title + subtitle + body + auth-aware "Back to home page" button) used for both the 404 and 503 presentations.
- Wired `notFoundComponent` (404 copy) and `errorComponent` (503 copy) onto `createRootRoute` in `src/routes/__root.tsx`, verified against the current TanStack Router (`^1.162.8`) API via context7 (root-route `errorComponent` catches child-route errors after bubbling past intermediate layouts, so it renders full-screen outside `DashboardLayout`).
- Added a dev-only trigger route `src/routes/error-preview.tsx` (`/error-preview`) — a standalone top-level route (not nested under the existing `_preview.tsx`), whose `loader` deliberately throws in development to preview the 503 page, and whose `beforeLoad` throws `notFound()` when `import.meta.env.PROD` so it's unreachable in production builds.
- Regenerated `src/routeTree.gen.ts` (generated file, not hand-edited) to register `/error-preview`.
- **unDraw illustrations used** (revised from an initial icon-only pass): `public/illustrations/page-not-found.svg` ("Page not found", `page-not-found_6wni`) and `public/illustrations/server-error.svg` ("Server Error", `server-error_syuz`), sourced from `cdn.undraw.co`, free for commercial use with no attribution required. Rendered via the `Image` common primitive with fixed dimensions.
- **404 vs 503 copy differentiated**: 404 subtitle changed from the initially-generic "Something went wrong" to "Page not found" so the two pages read distinctly at a glance (503 keeps "Something went wrong on our end"). Title ("Oops!") and button label stay shared for family consistency.
- **404 code badge removed**: `StatusPage`'s `code` prop is now optional and only renders when passed. `notFoundCopy` in `__root.tsx` omits it — the "Page not found" illustration already spells out "404" visually, so a separate "404" text label was redundant. `serverErrorCopy` still passes `code: "503"` since that illustration doesn't depict the code.

## Why
- `system_architecture.md §4.12` (freshly added) required a shared status page wired into the router root, not gated by auth, full-screen, TDD-first.
- The existing `_preview.tsx` pathless layout wraps children in `DashboardLayout` and was deliberately left un-gated in the prior commit (`0db3434`, enabling design previews in staging) — nesting the error trigger there would have both broken "full-screen, no sidebar" and put a `PROD` gate on a route intentionally kept open. A standalone top-level route avoids both problems without touching `_preview.tsx`.
- Follow-up user feedback asked to (1) replace the lucide-icon treatment with unDraw SVG illustrations, since icon colors shift with the theme token, and (2) make the two pages' messages read as more clearly distinct. Both were implemented as revisions to the initial build.
- **Illustrations are placed in `public/illustrations/`, not imported from `src/assets/`.** Vite's default small-asset inlining (assets under `assetsInlineLimit`, ~4KB) re-encodes SVG imports as a lossy single-quote "mini" data URI. For `server-error.svg` (2.2KB, under the threshold) this produced a data URI that a live `<img src>` failed to decode (`naturalWidth: 0` despite `complete: true`), confirmed by comparing against a fully `encodeURIComponent`-encoded version of the identical content, which decoded correctly. The `?url` import suffix (which should force a real file URL) did not avoid this in dev. Moving both SVGs to `public/` sidesteps Vite's asset-transform pipeline entirely — they're served byte-for-byte at a stable path (`/illustrations/*.svg`), which is also how `page-not-found.svg` (23KB, above the inline threshold, never hit the bug) was already working.
- Both illustrations are self-contained scenes (no full-bleed background rect), so they composite cleanly on the dark theme's `bg-background` without needing a light backing card — verified visually in both themes via chrome-devtools MCP.
- **The 503 copy has no reference image** (only the 404 reference was provided) — written to match the confirmed 404 voice ("Oops!" / plain, friendly, short sentences), not transcribed from any source.
- The 404 body text was grammar-cleaned from the reference's "we suggest you back to home" to "We suggest going back to the home page."
- Router config had to live on the root route (`createRootRoute`), not `main.tsx`'s `createRouter` — `src/test/test-utils.tsx`'s `renderRoute` builds its own router from `routeTree` only, with no `defaultNotFoundComponent`/`defaultErrorComponent`, so only root-route-level config is visible to tests (and consistent with the app).
- The `StatusPage.test.tsx` differentiation test asserts on illustration `alt` text rather than `src`, because jsdom never fires the `Image` primitive's async preload `onload`, so both rendered `<img>` elements stay on the shared fallback placeholder regardless of the real asset — `alt` is set synchronously and is also the more meaningful, accessible signal per the project's "test accessible behavior, not implementation" testing rule.

## Files touched
- `src/components/common/StatusPage.tsx` (new)
- `src/components/common/StatusPage.test.tsx` (new)
- `src/routes/error-preview.tsx` (new)
- `src/routes/__root.tsx` (modified — added `notFoundComponent`/`errorComponent`, illustration copy)
- `src/routeTree.gen.ts` (generated, regenerated)
- `public/illustrations/page-not-found.svg` (new)
- `public/illustrations/server-error.svg` (new)

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed failing on the router's bare built-in "Not Found" fallback, not a setup crash, and again for the illustration/copy revision), then implemented to green
- [x] `npm run test` passes (127/127, 21 files, updated for the code-badge removal)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (0 errors; 5 pre-existing warnings in unrelated files)
- [ ] `/qa-audit` run (not run this pass)
- [x] Renders in **both** light and dark — verified via chrome-devtools MCP screenshots at `/this-does-not-exist` (404) and `/error-preview` (503), both themes; confirmed no sidebar/topbar in the a11y snapshot
- [ ] Reconciled against Figma frame — not applicable; user confirmed this reference wasn't in Figma

## Notes / follow-ups
- Confirmed via production build (`vite build` + `vite preview`) that `/error-preview` renders the 404 page, not the 503, when `import.meta.env.PROD` is true.
- `RootLayout` carries a pre-existing off-token `bg-slate-50` (out of scope for this change); `StatusPage` paints its own `bg-background` over the full viewport so both themes render correctly regardless.
- unDraw illustration colors are fixed (baked into the SVG, one shared `#6c63ff` accent) and intentionally do not respond to the light/dark token switch, per the request that prompted this revision.
- A separate dev server for this project (started outside this session, port 5175) was showing stale HMR state after the `public/illustrations/` and route changes — restarted with the user's confirmation so `/error-preview` correctly reflected the current code.
