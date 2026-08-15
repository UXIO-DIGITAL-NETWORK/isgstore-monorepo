import { queryClient } from "@/config/queryClient";
import { useAuthStore } from "@/store/useAuthStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";

/**
 * Tear down every trace of the signed-in session on the client.
 *
 * Logout must leave nothing behind: stale member/dashboard data surviving in
 * the query cache would flash — or worse, misbehave — under the next account
 * that signs in. This runs from every logout path (the logout button, the menu,
 * and the axios 401 refresh-failure fallback) so they can never drift apart.
 *
 * - queryClient.clear()      → drop all cached queries (dashboard, transactions…)
 * - clearAuth()              → remove the access/refresh cookies + auth state
 * - clearPendingOrder()      → discard any in-flight checkout state
 *
 * The i18next language in localStorage is intentionally left untouched: it is a
 * device preference, not session data.
 */
export function clearClientSession(): void {
  queryClient.clear();
  useAuthStore.getState().clearAuth();
  useCheckoutStore.getState().clearPendingOrder();
}
