import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { API_VERSION, ENV } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";
import { clearClientSession } from "@/lib/session";
import { closureFromError, isAlwaysOpenUrl, setSiteClosure } from "@/lib/siteClosed";
import { installMockAdapter } from "@/mocks";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Local-only: answer every request from `src/mocks/` fixtures instead of the
// network. Off by default; the default build never loads the fixtures.
if (ENV.USE_MOCK_DATA) {
  if (import.meta.env.PROD) {
    console.warn("[mocks] USE_MOCK_DATA is enabled in a production build — disable it.");
  }
  installMockAdapter(api);
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/** Auth endpoints must never trigger a refresh — that would recurse. */
const AUTH_PATH = `${API_VERSION}/auth/`;

/** Marker so a replayed request can only be replayed once. */
type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

/**
 * Single in-flight refresh shared by every 401 that arrives while it runs.
 *
 * Without this, a page that fires several queries at once would send one
 * refresh per query; the first rotates the token and the rest then fail
 * against a token that no longer exists, logging the user out mid-session.
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();

  // Checked before the memoized promise is built, never inside it. A body that
  // returns without ever awaiting runs its `finally` synchronously — i.e.
  // *before* `??=` finishes assigning — so `refreshInFlight` would be left
  // holding a resolved-null promise forever. One 401 while signed out (a guest
  // hitting a members-only read) then disabled refresh for the whole session:
  // after logging in, the first expired token would log the user straight out.
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight ??= (async () => {
    const { setToken } = useAuthStore.getState();

    try {
      // Bare axios, not `api`: our request interceptor would attach the
      // *expired* access token instead of the refresh token.
      const { data } = await axios.post(
        `${ENV.API_BASE_URL}${API_VERSION}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { Accept: "application/json" } },
      );

      const nextAccess: string | undefined = data?.data?.access_token;
      const nextRefresh: string | undefined = data?.data?.refresh_token;

      if (!nextAccess) {
        clearClientSession();
        return null;
      }

      setToken(nextAccess, nextRefresh);
      return nextAccess;
    } catch {
      clearClientSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function redirectToLogin(): void {
  const locale = window.location.pathname.split("/")[1] || "id";
  window.location.replace(`/${locale}/login`);
}

api.interceptors.response.use(
  // Unwrap to the response body, so callers work with the API envelope
  // directly instead of reaching through `response.data` every time.
  (response) => {
    // A successful call to a GATED endpoint is the site telling us it is open
    // again — which is how the notice clears itself after the Hub re-activates,
    // without a reload. Endpoints that stay open while the site is dark
    // (settings, ping, auth) answer 200 regardless, so they must never clear
    // it — otherwise the notice flickers away on landing.
    if (!isAlwaysOpenUrl(response.config?.url)) {
      setSiteClosure(null);
    }

    return response.data;
  },
  async (error: AxiosError) => {
    // The Hub switched this deployment off, or its licence lapsed. Recorded
    // before anything else: every public request is failing the same way, and
    // the customer deserves an explanation rather than a wall of toasts.
    const closure = closureFromError(error);

    if (closure) {
      setSiteClosure(closure);

      return Promise.reject(error);
    }

    const config = error.config as RetriableConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isAuthRequest = config?.url?.startsWith(AUTH_PATH) ?? false;

    if (!isUnauthorized || isAuthRequest || !config || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    const token = await refreshAccessToken();

    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      return api.request(config);
    }

    // Only bounce someone who actually had a session. A guest whose request
    // happened to 401 must not be thrown onto the login page mid-checkout.
    const { token: currentToken, refreshToken: currentRefresh } = useAuthStore.getState();

    if (currentToken || currentRefresh) {
      clearClientSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);
