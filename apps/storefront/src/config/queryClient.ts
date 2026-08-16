import { QueryClient } from "@tanstack/react-query";

/**
 * The single app-wide TanStack Query client.
 *
 * Kept in its own module (rather than created inline in main.tsx) so
 * non-React code — the axios interceptor and the logout teardown — can reach
 * the same instance to wipe cached data on logout.
 */
export const queryClient = new QueryClient();
