import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, act } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";
import { ThemeProvider } from "@/providers/theme-provider";
import type { User } from "@/models/user.model";

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
    email: "dimas@udn.com",
    phone: "6281234567890",
    balance: 9999999,
    point: 9999,
    locale: "id",
    timezone: "Asia/Jakarta",
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
        <RouterProvider router={router} />
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
