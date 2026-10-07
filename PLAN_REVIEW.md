# Storefront Mobile Performance — PageSpeed Improvement Plan

**Target:** `https://isgstore.id/` (storefront), code in `apps/storefront/`
**Reference report:** PageSpeed Insights, mobile — https://pagespeed.web.dev/analysis/https-isgstore-id/pyjn522nz3?hl=id&form_factor=mobile
**Confirmed decisions:** SPA critical-path fixes only (no SSR/prerender) · app code + document nginx (no CI changes) · self-host + subset fonts · build-time WebP + component fixes.

> **Status:** Approved. Implementation begins when the owner types **“execute.”**
> **Baseline caveat:** the live report could not be fetched (PSI API needs a key; pagespeed.dev is client-rendered). The failing areas below are derived from a code audit and map directly to the audits the report flags. Confirm against the live report before/after.

---

## Why it's slow (root causes found in code)

1. **Pure CSR SPA** — `index.html` ships an empty `<div id="root">`; nothing paints until JS parses + React renders. LCP is doubly delayed.
2. **Hero LCP is chained:** `$locale` route render → `useHeroBanners()` query (skeleton until `GET /banners`) → `Image` component defers real `src` to a JS `new window.Image()` preload → opacity transition. (`HeroBanner.tsx`, `useHeroBanners.ts`, `Image.tsx`)
3. **`Image.tsx` defeats lazy-loading** — its `useEffect` preloads *every* image on mount regardless of `priority`, so all below-the-fold art loads eagerly. No `width/height`, no `fetchpriority`.
4. **Render-blocking fonts** — `index.html` loads **4 Google Font families** (DM Sans, IBM Plex Sans Condensed, Inter, Outfit) as a blocking third-party stylesheet; no font preload.
5. **Whole app in the entry bundle** — all **19 namespaces × 2 locales = 38 JSON files** statically imported in `config/i18n.ts`.
6. **Google Identity Services loads on every page** — `GoogleOAuthProvider` wraps the whole app in `main.tsx`, injecting `accounts.google.com/gsi/client` even on the homepage.
7. **No modern image formats** — bundled assets are PNG/JPEG only; no WebP/AVIF; `Image`'s `srcset` generator is dead code.
8. **CLS risk** — images reserve no dimensions; `HeroBanner.tsx:105` has a typo `asspectRatio` (ignored); carousel auto-rotates every 4.5s; `useHeroCarousel` effect has no dependency array (restarts interval every render).
9. **Server-side audits** — no cache-control/compression config in repo (nginx lives on the server). To be documented.

---

## Workstreams & exact changes

### 1. Fonts — self-host & de-bloat
**Add deps (in `apps/storefront/package.json`):**
- `@fontsource-variable/inter`
- `@fontsource-variable/outfit`
- `@fontsource-variable/dm-sans`
- `@fontsource/ibm-plex-sans-condensed` (static — only the weights actually used)

**Changes:**
- `src/index.css` (or `src/main.tsx`) — add `@import`s for only the Latin subsets + used weights. Fontsource `@font-face` blocks use `font-display: swap`, so no render block. Keep existing `--font-*` CSS variables unchanged.
- Determine real weights first: grep `font-(thin|light|normal|medium|semibold|bold|extrabold|black)`; import only those static faces for Plex (variable fonts cover all weights for Inter/Outfit/DM Sans).
- `index.html` — **remove** the Google Fonts `<link>` and the two `preconnect` hints.
- Result: deletes the only render-blocking third-party request; same-origin, subset fonts.

### 2. LCP hero
- `src/features/home/hooks/useHeroBanners.ts` — add `initialData: BANNERS` (and keep `select` fallback) so the hero renders **synchronously** (no skeleton on first paint). Local `BANNERS` paint as the initial LCP; API banners crossfade in without shifting (fixed aspect box).
- `src/features/home/components/hero/HeroBanner.tsx`
  - Fix typo `asspectRatio:` → `aspectRatio:` (line ~105, peek slide style).
  - Fix prop mismatch: `SlideImage` passes `loading`, but `Image` reads `priority`. Use `priority={idx === 0 ? "eager" : "lazy"}`.
  - Guarantee idx 0 gets `fetchpriority="high"`, `loading="eager"`, `decoding="async"`.
  - Keep the fixed `aspect-video md:aspect-13/4` wrapper so the API swap causes no CLS.
- `index.html` — add an inline **critical shell** (page background + hero aspect box) so the first paint isn't a black gap, and a hero image preload (see §6).

### 3. Rewrite `src/components/common/Image.tsx`
- **Remove** the `new window.Image()` preloader effect; set `<img src={src}>` directly.
- Attach browser-native `onLoad`/`onError` on the `<img>` for the placeholder fade (never gate the `src`).
- Props: add `aspectRatio` (→ `style.aspectRatio` on the wrapper, reserves space) and `fetchPriority` (`priority==="eager"` → `fetchPriority="high"`).
- `loading`: `eager` for priority, `lazy` otherwise. `decoding="async"` **always** (drop the blocking `sync`).
- Keep `srcSet`/`sizes` pass-through for `vite-imagetools` callers; delete the broken `?w=&q=` `generateSrcSet()`.
- Preserve the existing public prop surface so ~20 call sites keep compiling.

### 4. Modern formats (build-time WebP/AVIF)
- **Add dev dep:** `vite-imagetools` (uses `sharp`).
- `vite.config.ts` — register `imagetools()`; add `/// <reference types="vite-imagetools/client" />` via `src/vite-env.d.ts` so `tsc -b` accepts query imports.
- Convert raster imports (SVGs untouched). Central registries first, then direct imports:
  - `src/constants/images.ts` (banners + flash sale) — use responsive variants for the hero: `?w=480;768;1110&format=webp&as=srcset` (feed `srcSet`+`src` into `Image`), plain `?format=webp` for the rest.
  - `src/constants/paymentLogos.ts` (14 logos + credit icon) — `?format=webp`.
  - Direct imports (~20): `CtaBanner` (CTA_3/CTA_2), `ProductBanner`, `AuthLayout` banner, `FaqPage`, kalkulator/zodiac/magic-wheel/leaderboard decorations, `PaymentSuccess/Failed/WaitingHero`, `PackageCard` icons, `placeholderArt`/`placeholderThumbnail`/`placeholderLogo`, `checkout/icon_credit`.
- Result: satisfies "serve images in modern formats" / "efficiently encode images".

### 5. i18n payload split
- New `src/locales/index.ts` exporting `loadLocale(locale)` → `Promise<Resource>` built from **dynamic** `import()` of that locale's 19 JSON files (id and en lazily loaded, never both in the entry chunk).
- `src/config/i18n.ts` — remove all 38 static imports; init with empty resources.
- `src/routes/$locale/route.tsx` — `beforeLoad`: `await loadLocale(locale)` then `i18n.addResourceBundle(...)` / `changeLanguage(locale)` **before** child routes render. Removes the EN text flash and keeps language ready before paint.
- Result: cuts the entry-chunk size significantly (JSON parse/TBT win).

### 6. Build config & hero preload
- `vite.config.ts`:
  - `build.rollupOptions.output.manualChunks`: group vendors to cut request count/waterfall — `react`/`react-dom`/`scheduler` → `react-vendor`; `@tanstack/*` → `tanstack`; `i18next`/`react-i18next` → `i18n`; `lucide-react` → `icons` (merges ~60 tiny icon chunks). Verify against TanStack `autoCodeSplitting`.
  - `build.modulePreload: { polyfill: false }` (modern targets only).
  - Keep `cssCodeSplit` default (true).
- Add a small local Vite plugin `heroPreloadPlugin` (`transformIndexHtml`, build only): replace a `<!--HERO_PRELOAD-->` token in `index.html` with `<link rel="preload" as="image" fetchpriority="high" type="image/webp" href="<hashed hero asset>">` + the inline critical shell. Resolve the hashed asset from `ctx.bundle` by matching the hero's original filename.
  - Fallback if plugin matching proves brittle: keep the inline shell + rely on React's early render with `fetchpriority="high"` (still a large win, just without the HTML-level preload).

### 7. Defer Google Identity Services
- Remove `GoogleOAuthProvider` from `src/main.tsx`.
- Add it around the auth subtree only — in `src/features/auth/layouts/AuthLayout.tsx` (wraps Login/Register/Forgot) — since `GoogleLogin`/`useGoogleLogin` are only used there. Stops the GSI script from loading on the homepage.

### 8. Responsive / CLS & best-practices polish
- `src/features/home/hooks/useHeroCarousel.ts` — add the missing dependency array to the interval effect (currently runs every render → constant interval churn/TBT) and memoize `goTo`; keep auto-rotate but pause when reduced-motion is set (optional).
- Add `aspectRatio`/dimensions to image boxes that reserve nothing above the fold (`PopularGameCard`, rails, article cards) so lazy loads don't shift layout.
- `index.html` — replace the default `/vite.svg` favicon with the real ISG favicon (best-practices/branding).
- `$locale/route.tsx` — set `document.documentElement.lang = locale` (a11y; low risk).
- Review `MaintenanceGate`/`SiteClosedGate` full-page swap on settings load for CLS; add reserved space or defer if it shifts (lower priority).

### 9. Nginx — document only (no CI change)
Add a documented snippet (new `docs/nginx-storefront.conf` referenced from `docs/04-deployment.md`):
- `gzip on; gzip_vary on; gzip_types text/css application/javascript image/svg+xml application/json;` (+ optional brotli).
- `location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }`
- `location = /index.html { add_header Cache-Control "no-cache"; }`
- Ensure HTTP/2 (+ HTTP/3 if available).
- Right now hashed assets are served with no explicit cache policy → "efficient cache policy" audit fails. Applying this is an ops step, not a code change.

---

## New dependencies
`@fontsource-variable/inter`, `@fontsource-variable/outfit`, `@fontsource-variable/dm-sans`, `@fontsource/ibm-plex-sans-condensed` (deps) · `vite-imagetools` (dev). All ship in `apps/storefront/package.json` + lockfile.

## Files to touch
- `apps/storefront/index.html`
- `apps/storefront/vite.config.ts`, `apps/storefront/package.json` (+ lockfile), `apps/storefront/src/vite-env.d.ts`
- `apps/storefront/src/main.tsx`, `src/index.css`, `src/config/i18n.ts`
- `apps/storefront/src/components/common/Image.tsx`
- `apps/storefront/src/features/home/components/hero/HeroBanner.tsx`
- `apps/storefront/src/features/home/hooks/useHeroBanners.ts`, `useHeroCarousel.ts`
- `apps/storefront/src/routes/$locale/route.tsx`
- `apps/storefront/src/features/auth/layouts/AuthLayout.tsx`
- `apps/storefront/src/constants/images.ts`, `src/constants/paymentLogos.ts` + ~20 direct asset-import sites
- **New:** `apps/storefront/src/locales/index.ts`, `docs/nginx-storefront.conf`, repo-root `PLAN_REVIEW.md`
- `docs/04-deployment.md` (link the nginx snippet)

---

## Verification
1. `npm run lint:storefront` and `npm run test:storefront` (no unit tests cover Image/Hero/i18n — safe).
2. `npm run build:storefront` — confirm: no `tsc` errors; `dist/assets` contains `.webp`; `dist/index.html` has the hero preload + inline shell and **no** Google Fonts link.
3. `npm --prefix apps/storefront run preview` → run Lighthouse **mobile** locally and compare LCP/CLS/TBT before vs after.
4. Manual checks: hero renders instantly with no skeleton flash, no layout shift on banner swap, fonts render (no obvious FOUT), `/en` shows English without a flash, homepage network panel shows **no** `accounts.google.com/gsi/client` and no `fonts.googleapis.com`.
5. After applying the nginx snippet on staging, re-run PageSpeed Insights on `https://isgstore.id/` (mobile) and confirm the same audits improve: LCP, CLS, TBT, "eliminate render-blocking resources", "serve images in modern formats", "uses efficient cache policy", "enable text compression".

## Risks / trade-offs
- **Hero source:** the local `BANNERS` paint first for a guaranteed fast LCP; the CMS `/banners` result crossfades in. If CMS artwork must be primary, keep the same aspect box to avoid CLS. (Confirm CMS banners are still wanted as the override.)
- **`manualChunks` vs TanStack `autoCodeSplitting`** can interact — verify chunk graph after build; drop the offending grouping if it regresses.
- **`vite-imagetools` query syntax** must typecheck under `tsc -b` (needs the client types reference).
- **Self-hosted fonts** change exact rendering slightly (variable fonts) and add repo size — acceptable per decision.
- **Server audits** (cache policy/compression) only improve once the documented nginx snippet is applied by ops.

## Execution order
1. Fonts (§1) → 2. `Image.tsx` rewrite (§3) → 3. Hero + `useHeroBanners`/`useHeroCarousel` (§2/§8) → 4. i18n split (§5) → 5. WebP/imagetools (§4) → 6. GSI defer (§7) → 7. Build config + preload plugin (§6) → 8. CLS/best-practice polish + nginx doc (§8/§9) → 9. Build, lint, test, Lighthouse, then re-check PageSpeed.

---

## Implementation results (done)

All workstreams implemented in `apps/storefront`. `npm run lint` (0 errors), `npm run build`, and `npm run test` (121 passing) are green.

**Lighthouse mobile, local production build** (`vite preview` of `dist/`, real API via a preview proxy, simulated throttling). Figures are directional — local preview is uncompressed and CDN-less, so the live gains depend on applying `docs/nginx-storefront.conf`.

| Metric | Start of session (local) | Final |
|---|---|---|
| Performance | 55–57 | **79** |
| FCP | 3.1–3.3 s | 3.0 s |
| LCP | 5.9 s | **4.4 s** |
| TBT | 21–58 ms | 30 ms |
| **CLS** | **0.28–0.40** | **0.0** |
| Best practices | 96 | 96 |
| Total bytes | 903 KiB | **617 KiB** |

### What landed beyond the plan
- **CLS root cause found and fixed:** the announcement strip and flash-sale section rendered tall skeletons, then collapsed to *nothing* when the API returned empty (both do, live). They now render nothing until data is known — the dominant CLS source (0.4 → 0).
- **Removed the global `@heroui/styles` import:** only the 404 page used HeroUI. Switching it to the project's own `Button` cut the render-blocking CSS from **519 KB → 145 KB** and the entry chunk from 176 KB → 133 KB.
- **Responsive hero `srcset` (480/768/1112 WebP)** plus a matching responsive `<link rel="preload" imagesrcset imagesizes>` injected at build (a plain single-URL preload would have fetched the wrong variant).
- **Preview proxy** added to `vite.config.ts` so `vite preview` mirrors the dev proxy (local preview now exercises the real API).
- Bundled art right-sized: hero WebP 2.7 MB JPEG → ~93 KB (1112px) / ~55 KB (768px mobile pick); CTA mascot 2.6 MB → 57 KB; checkout banner 995 KB → 67 KB.

### Known remaining (out of scope, by decision)
- **LCP ≈ 4.4 s** on mobile is bounded by client-side rendering — nothing paints until the JS bundle runs. The real fix is prerender/SSR, which was explicitly descoped. Preload + `fetchpriority` are in place.
- **`uses-responsive-images`** still flags ~50 KiB (CTA art) and **remote API images** (game/article art) can't be resized without an image proxy.
- `unused-javascript` ~23 KiB, render-blocking ~600 ms (uncompressed local preview).
- Applying `docs/nginx-storefront.conf` (gzip/brotli + immutable cache) is required for the cache-policy and compression audits on the live host.

