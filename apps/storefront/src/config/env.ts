/**
 * Boot-time environment constants.
 *
 * `API_BASE_URL` stops at `/api` — the version segment lives in each service
 * path (`/v1/...`) so a future `/v2` can be adopted one endpoint at a time
 * instead of all at once.
 */
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

  // Release stamp, baked at build from the tag it ships (e.g. "v1.4.0"). Empty
  // on a local build.
  APP_VERSION: cleanEnv(import.meta.env.VITE_APP_VERSION),

  // Pusher (hosted, pusher.com) — powers live invoice/member status. Left empty
  // until credentials are provisioned; the app then falls back to polling.
  // Mirror these with the backend's PUSHER_APP_KEY / PUSHER_APP_CLUSTER.
  PUSHER_APP_KEY: cleanEnv(import.meta.env.VITE_PUSHER_APP_KEY),
  PUSHER_APP_CLUSTER: cleanEnv(import.meta.env.VITE_PUSHER_APP_CLUSTER, "ap1"),

  // Google Sign-In OAuth Client ID. Empty until provisioned — the login page
  // hides the Google button when it is missing so it never renders broken.
  GOOGLE_CLIENT_ID: cleanEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID),
} as const;

/** Version prefix shared by every service module. */
export const API_VERSION = "/v1" as const;
