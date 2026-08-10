export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",

  // Laravel Reverb (WebSocket, Pusher protocol) — powers the live transactions
  // feed. Empty until provisioned; the table then falls back to slow polling.
  // Mirror these with the backend's REVERB_* values.
  REVERB_APP_KEY: import.meta.env.VITE_REVERB_APP_KEY || "",
  REVERB_HOST: import.meta.env.VITE_REVERB_HOST || "localhost",
  REVERB_PORT: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME || "http",
} as const;

/**
 * The API's version segment. `VITE_API_BASE_URL` stops at `/api`, so every
 * service prepends this — matching the consumer storefront, which shares the
 * same backend. Keeping it out of the base URL is what lets the refresh
 * interceptor recognise an auth path (`/v1/auth/...`) without string-matching
 * a full URL.
 */
export const API_VERSION = "/v1" as const;
