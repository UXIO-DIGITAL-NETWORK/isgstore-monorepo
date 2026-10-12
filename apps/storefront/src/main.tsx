import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

// Self-hosted fonts — bundled same-origin, no render-blocking third-party CSS.
// Variable families carry the wght axis; Inter's italic face is pulled in
// separately because a few labels use `italic`.
import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-sans-condensed/400.css";
import "@fontsource/ibm-plex-sans-condensed/500.css";
import "@fontsource/ibm-plex-sans-condensed/600.css";
import "@fontsource/ibm-plex-sans-condensed/700.css";

import i18n from "@/config/i18n";
import { queryClient } from "@/config/queryClient";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { RouteErrorComponent, RoutePendingComponent } from "@/components/shared/RouteStateFallbacks";
import "./index.css";

import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  // App-wide fallbacks so a route failure or a slow route never falls through
  // to the router's unstyled default.
  defaultErrorComponent: RouteErrorComponent,
  defaultPendingComponent: RoutePendingComponent,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Boots the app.
 *
 * Mock mode is wired here — not in `axios.ts` — so the fixtures and their
 * bundled images sit behind a dynamic import. `import.meta.env.VITE_USE_MOCK_DATA`
 * is replaced at build time, so a build without the flag drops this branch (and
 * the fixtures chunk) entirely and production keeps its lean bundle. The adapter
 * is installed before the first render, so no query ever races it.
 */
async function bootstrap(): Promise<void> {
  try {
    if (import.meta.env.VITE_USE_MOCK_DATA === "true") {
      if (import.meta.env.PROD) {
        console.warn("[mocks] USE_MOCK_DATA is enabled in a production build — disable it.");
      }

      const [{ installMockAdapter }, { api }, { queryClient }, { ok }, home] = await Promise.all([
        import("@/mocks"),
        import("@/config/axios"),
        import("@/config/queryClient"),
        import("@/mocks/envelope"),
        import("@/mocks/data/home"),
      ]);

      installMockAdapter(api);

      // Seed the two *section* queries that would otherwise insert above the
      // fold ~200ms after load and shift the page (the announcement strip and
      // the flash sale). The hero is deliberately left to its bundled fallback:
      // seeding it would pull all six fixture banners onto the critical path and
      // delay the LCP image. All of this lives in the lazily-loaded mock chunk,
      // so a production build never carries any of it.
      queryClient.setQueryData(["announcements"], home.MOCK_ANNOUNCEMENTS);
      queryClient.setQueryData(["flash-sale"], ok(home.MOCK_FLASH_SALE));
    }
  } catch (error) {
    // A failed mock chunk must never leave a blank page — fall back to the API.
    console.warn("[mocks] failed to install the mock adapter; using the real API.", error);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          {/* Inside I18next so the crash notice is translated; outside the
              router so it also catches a crash in the root layout itself. */}
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </I18nextProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
