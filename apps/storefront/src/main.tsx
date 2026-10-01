import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { GoogleOAuthProvider } from "@react-oauth/google";

import i18n from "@/config/i18n";
import { ENV } from "@/config/env";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          {/* Inside I18next so the crash notice is translated; outside the
              router so it also catches a crash in the root layout itself. */}
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </I18nextProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
