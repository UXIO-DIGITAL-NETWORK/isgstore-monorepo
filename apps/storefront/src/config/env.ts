/**
 * Boot-time environment constants.
 *
 * `API_BASE_URL` stops at `/api` — the version segment lives in each service
 * path (`/v1/...`) so a future `/v2` can be adopted one endpoint at a time
 * instead of all at once.
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
} as const;

/** Version prefix shared by every service module. */
export const API_VERSION = "/v1" as const;
