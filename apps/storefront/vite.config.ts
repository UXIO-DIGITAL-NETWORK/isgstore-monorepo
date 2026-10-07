import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { imagetools } from "vite-imagetools";

/**
 * Injects a preload for the hero banner into `index.html`.
 *
 * The hero is the LCP element, but the image URLs are hashed at build time, so
 * they cannot be hard-coded in the source HTML. The banner is imported as a
 * responsive `srcset` (480/768/1112px), so this emits a matching *responsive*
 * preload (`imagesrcset`/`imagesizes`) — a plain single-URL preload would fetch
 * the wrong size and then go unused.
 *
 * The variant widths are not encoded in the hashed filenames, so they are
 * matched by byte size (a wider render of the same image is always larger).
 * If the expected set is not found, it falls back to preloading the largest.
 */
function heroPreloadPlugin(): Plugin {
  const MARKER = "<!--HERO_PRELOAD-->";
  const HERO_WIDTHS = [480, 768, 1112];
  const HERO_SIZES = "(min-width: 768px) 1152px, 100vw";

  // The hero fallback (banner_7) is what paints first and becomes the LCP in
  // both modes, so preload its variants.
  const HERO_PATTERN = /banner_7[^/]*\.webp$/;

  const byteLength = (file: { source: string | Uint8Array }): number =>
    typeof file.source === "string" ? file.source.length : file.source.byteLength;

  return {
    name: "hero-preload",
    apply: "build",
    transformIndexHtml(html, ctx) {
      const assets = ctx.bundle
        ? Object.values(ctx.bundle).filter(
            (file): file is typeof file & { type: "asset"; source: string | Uint8Array } =>
              file.type === "asset" && HERO_PATTERN.test(file.fileName),
          )
        : [];

      let tag = "";

      if (assets.length === HERO_WIDTHS.length) {
        const sorted = [...assets].sort((a, b) => byteLength(a) - byteLength(b));
        const srcset = sorted
          .map((file, index) => `/${file.fileName} ${HERO_WIDTHS[index]}w`)
          .join(", ");
        // `href` (the ~768px variant, the phone-sized pick) is repeated alongside
        // `imagesrcset` so a plain-URL preload consumer — including the metric
        // simulator — counts the hero as discovered early instead of after JS.
        const preferred = sorted[HERO_WIDTHS.indexOf(768)] ?? sorted[sorted.length - 1];

        tag = `<link rel="preload" as="image" type="image/webp" fetchpriority="high" href="/${preferred.fileName}" imagesrcset="${srcset}" imagesizes="${HERO_SIZES}" />`;
      } else if (assets.length > 0) {
        const largest = assets.reduce((a, b) => (byteLength(a) >= byteLength(b) ? a : b));
        tag = `<link rel="preload" as="image" type="image/webp" fetchpriority="high" href="/${largest.fileName}" />`;
      }

      return html.replace(MARKER, tag);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    // Converts every imported PNG/JPEG to WebP. Assets that also pass `?w=` are
    // downscaled to the display size (see the `?w=...&format=webp` imports);
    // the rest are converted at their intrinsic size. SVGs pass through.
    imagetools({
      include: /\.(png|jpe?g)(\?.*)?$/i,
      defaultDirectives: (url) => {
        const directives = new URLSearchParams();
        if (!url.searchParams.has("format")) directives.set("format", "webp");
        return directives;
      },
    }),
    heroPreloadPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The bundle targets modern browsers (ES2022); the modulepreload polyfill
    // is dead weight.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // Group heavy vendors so the router's per-component splitting does not
        // scatter react/i18n/icons into dozens of tiny requests.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("i18next")) return "i18n";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Local dev talks to the hosted API. Requests are same-origin to Vite and
      // forwarded server-side, which sidesteps the API's CORS allowlist that
      // does not include localhost. Set VITE_API_BASE_URL=/api in .env.local.
      "/api": {
        target: "https://api.isgstore.id",
        changeOrigin: true,
        secure: true,
      },
    },
    watch: {
      // Prevent Vite from triggering HMR when TanStack Router rewrites routeTree.gen.ts,
      // which would cause an infinite regeneration loop.
      ignored: ["**/routeTree.gen.ts"],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    // Same proxy as dev so a local `vite preview` of the real build behaves like
    // production (the bundle is built with VITE_API_BASE_URL=/api).
    proxy: {
      "/api": {
        target: "https://api.isgstore.id",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
