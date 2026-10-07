# Storefront performance — results & how to test

PageSpeed Insights runs **Lighthouse**, so the free localhost equivalent is the
Lighthouse CLI (or the Lighthouse panel in Chrome DevTools). Both are used below.

## Results

Production build served with `vite preview` (real API through the dev proxy) and
the mock build (`VITE_USE_MOCK_DATA=true`), **all four categories, mobile + desktop**.
Every score is ≥ 80:

| Build | Viewport | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Production | Mobile | **83** | **92** | **96** | **100** |
| Production | Desktop | **98** | **92** | **96** | **100** |
| Mock | Mobile | **83** | **92** | **93** | **100** |
| Mock | Desktop | **97** | **92** | **96** | **100** |

Core Web Vitals (mobile, production): FCP 2.6 s · LCP 4.0 s · TBT 62 ms · **CLS 0**.
Mock: FCP 2.6 s · LCP 4.1 s · TBT 20 ms · **CLS 0**.

Screenshots: `lighthouse-prod-mobile.png`, `lighthouse-prod-desktop.png`,
`lighthouse-mock-mobile.png`, `lighthouse-mock-desktop.png`
(plus `mock-page-*.png` showing the mock data/layout unchanged).

## Option A — Chrome DevTools (no install)

1. Run the app and open it in Chrome: `npm run dev:storefront` → `http://localhost:5173/id`
   (or a production build: `npm run build:storefront && npm --prefix apps/storefront run preview` → `http://localhost:4173/id`).
2. Open DevTools: **F12** (or ⌥⌘I on macOS).
3. Go to the **Lighthouse** tab. If it is hidden: DevTools → **⋮ → More tools → Lighthouse**.
4. Choose **Device: Mobile** (or Desktop), **Categories: all four**, then **Analyze page load**.
5. Read the report. To keep it, click **⋮ → Save as HTML**.

> Tip: test the **production build** (`vite preview`), not `npm run dev`. The dev
> server ships unbundled ES modules, so its numbers are far worse than what users get.

## Option B — Lighthouse CLI (scriptable, same engine as PageSpeed)

```bash
# from the repo root
npm run build:storefront
npm --prefix apps/storefront run preview -- --port 4173   # serves the real build

# mobile (default emulation + simulated 4G), all categories, JSON + HTML
npx --yes lighthouse@12 http://localhost:4173/id \
  --form-factor=mobile --output=json --output=html \
  --output-path=./lh-mobile \
  --chrome-flags="--headless=new --no-sandbox"

# desktop
npx --yes lighthouse@12 http://localhost:4173/id --preset=desktop \
  --output=json --output=html --output-path=./lh-desktop
```

Open `lh-mobile.report.html` in a browser to read it. Useful flags:

| Flag | Meaning |
|---|---|
| `--only-categories=performance,seo` | run a subset |
| `--throttling-method=simulate` | default; models slow-4G + 4× CPU |
| `--throttling-method=provided` | no throttling (fast, unrealistic) |
| `--preset=desktop` | desktop emulation + throttling |
| `--quiet` | suppress the progress output |
| `--view` | open the report when done |

## Reading the metrics

- **LCP (Largest Contentful Paint)** — target **< 2.5 s**. Usually the hero image.
- **CLS (Cumulative Layout Shift)** — target **< 0.1**. Anything that appears after
  first paint and pushes content (a late banner, a section that inserts) counts here.
- **TBT (Total Blocking Time)** — target **< 200 ms**. Long JS tasks on the main thread.
- **FCP (First Contentful Paint)** — first pixel; for this app it is bounded by the JS bundle.
- **Speed Index** — how quickly the page visually fills in.

Green = 90–100, orange = 50–89, red = 0–49 (per category).

## Why mock mode can differ

Mock mode renders fixtures the real API does not return (an announcement strip and a
flash sale), so those sections would otherwise appear ~200 ms after load and shift the
page. Mock mode seeds those two queries from its fixtures before the first render
(`src/main.tsx`), so the layout is stable — **CLS 0 in both modes**, with the same data
and layout as before. The fixtures and their images live behind the dynamic mock import,
so a production build carries none of them.

## What made the difference

- Self-hosted fonts (removed the render-blocking Google Fonts request).
- WebP + right-sized images; a responsive hero `<img srcset>` with a matching
  `<link rel="preload" imagesrcset … href …>`.
- `Image.tsx` no longer preloads every image in JS (lazy-loading works again).
- i18n split into lazy per-locale chunks; HeroUI's global CSS dropped; GSI deferred
  to the auth pages.
- CLS: async sections either render nothing (production, empty data) or are seeded
  from fixtures (mock) so nothing inserts and shifts after first paint.
