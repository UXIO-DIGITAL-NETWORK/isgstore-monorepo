export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
} as const;

/**
 * The API's version segment. `VITE_API_BASE_URL` stops at `/api`, so every
 * service prepends this — matching the consumer storefront, which shares the
 * same backend. Keeping it out of the base URL is what lets the refresh
 * interceptor recognise an auth path (`/v1/auth/...`) without string-matching
 * a full URL.
 */
export const API_VERSION = "/v1" as const;
