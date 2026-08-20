/**
 * Boot-time environment constants.
 *
 * `API_BASE_URL` stops at `/api` — the version segment lives in each service
 * path (`/v1/...`) so a future `/v2` can be adopted one endpoint at a time
 * instead of all at once.
 */
/**
 * Read a Vite env var, trimming whitespace and any stray surrounding quotes.
 * A deploy that sets `VITE_REVERB_HOST="localhost"` (quotes included) would
 * otherwise bake the quotes into the value and produce a `wss://"localhost"`
 * URL that can never connect — so strip them defensively.
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

  // Laravel Reverb (WebSocket, Pusher protocol) — powers live invoice/member
  // status. Left empty until credentials are provisioned; the app then falls
  // back to polling. Mirror these with the backend's REVERB_* values.
  REVERB_APP_KEY: cleanEnv(import.meta.env.VITE_REVERB_APP_KEY),
  REVERB_HOST: cleanEnv(import.meta.env.VITE_REVERB_HOST, "localhost"),
  REVERB_PORT: Number(cleanEnv(import.meta.env.VITE_REVERB_PORT, "8080")) || 8080,
  REVERB_SCHEME: cleanEnv(import.meta.env.VITE_REVERB_SCHEME, "http"),

  // Google Sign-In OAuth Client ID. Empty until provisioned — the login page
  // hides the Google button when it is missing so it never renders broken.
  GOOGLE_CLIENT_ID: cleanEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID),
} as const;

/** Version prefix shared by every service module. */
export const API_VERSION = "/v1" as const;
