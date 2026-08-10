/**
 * Boot-time environment constants.
 *
 * `API_BASE_URL` stops at `/api` — the version segment lives in each service
 * path (`/v1/...`) so a future `/v2` can be adopted one endpoint at a time
 * instead of all at once.
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",

  // Laravel Reverb (WebSocket, Pusher protocol) — powers live invoice/member
  // status. Left empty until credentials are provisioned; the app then falls
  // back to polling. Mirror these with the backend's REVERB_* values.
  REVERB_APP_KEY: import.meta.env.VITE_REVERB_APP_KEY || "",
  REVERB_HOST: import.meta.env.VITE_REVERB_HOST || "localhost",
  REVERB_PORT: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME || "http",
} as const;

/** Version prefix shared by every service module. */
export const API_VERSION = "/v1" as const;
