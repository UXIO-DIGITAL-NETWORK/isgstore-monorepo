import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, act } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { User } from "@/models/user.model";
import { PLATFORM_TIMEZONE } from "@/utils/date";

/**
 * Canonical mock of the confirmed staging login user (role_id 1 =
 * super-admin). Name/email deliberately collide with no dashboard fixture so
 * exact-text queries can tell the authenticated user apart from sample rows.
 */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    role_id: 1,
    name: "Dimas Sufyan",
    email: "dimas@isgstore.id",
    phone: "6281234567890",
    balance: 9999999,
    point: 9999,
    // Matches the locale `test/setup.ts` pins the panel to. `useLocale` adopts
    // the account's language on mount, so a fixture that disagrees with the
    // harness would flip every rendered screen back to Indonesian while the
    // assertions still read English.
    locale: "en",
    // The platform's zone: the panel renders WIB on every host, so a fixture
    // that varied with the CI box would only hide a formatter that still reads
    // the browser's zone.
    timezone: PLATFORM_TIMEZONE,
    email_verified_at: "2026-07-10T13:39:19.000000Z",
    created_at: "2026-07-01T00:00:00.000000Z",
    updated_at: "2026-07-10T13:39:19.000000Z",
    ...overrides,
  };
}

/**
 * Reusable render helper for route-level tests. Builds a real router from the
 * actual generated route tree (so guards/layouts run exactly as in the app),
 * plus a fresh QueryClient and the app's ThemeProvider. Route resolution is
 * async, so this awaits the router being ready before returning.
 */
export async function renderRoute(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Mirrors main.tsx. Radix's Tooltip.Root throws "`Tooltip` must be used
            within `TooltipProvider`" without it, so any screen carrying an
            InfoTooltip — the settings page's labels, for one — would fail to
            render here rather than in the browser. */}
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  await act(async () => {
    await router.load();
  });

  return { ...utils, router };
}

// eslint-disable-next-line react-refresh/only-export-components -- test helper file, not a component
export * from "@testing-library/react";
