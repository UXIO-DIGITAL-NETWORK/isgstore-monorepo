/**
 * Read a Vite env var, trimming whitespace and any stray surrounding quotes.
 * A deploy that sets `VITE_PUSHER_APP_KEY="abc"` (quotes included) would
 * otherwise bake the quotes into the value and hand pusher-js a key it can
 * never authenticate with — so strip them defensively.
 */
const cleanEnv = (value: unknown, fallback = ""): string => {
  const s = String(value ?? "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
  return s || fallback;
};

export const ENV = {
  API_BASE_URL: cleanEnv(import.meta.env.VITE_API_BASE_URL, "http://localhost:8000/api"),

  // Pusher (hosted, pusher.com) — powers the live transactions feed. Empty until
  // provisioned; the table then falls back to slow polling. Mirror these with the
  // backend's PUSHER_APP_KEY / PUSHER_APP_CLUSTER.
  PUSHER_APP_KEY: cleanEnv(import.meta.env.VITE_PUSHER_APP_KEY),
  PUSHER_APP_CLUSTER: cleanEnv(import.meta.env.VITE_PUSHER_APP_CLUSTER, "ap1"),
} as const;

/**
 * The API's version segment. `VITE_API_BASE_URL` stops at `/api`, so every
 * service prepends this — matching the consumer storefront, which shares the
 * same backend. Keeping it out of the base URL is what lets the refresh
 * interceptor recognise an auth path (`/v1/auth/...`) without string-matching
 * a full URL.
 */
export const API_VERSION = "/v1" as const;
