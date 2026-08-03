import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { API_VERSION, ENV } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Add Bearer Token if available
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
 * Access tokens expire after 60 minutes, so a dashboard left open comes back
 * firing several queries at once. Without sharing, each would send its own
 * refresh; the first rotates the pair and the rest then fail against a refresh
 * token the server has already invalidated — logging the admin out precisely
 * when the refresh was supposed to keep them in.
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();

  // Checked before the memoized promise is built, never inside it. A body that
  // returns without ever awaiting runs its `finally` synchronously — i.e.
  // *before* `??=` finishes assigning — so `refreshInFlight` would be left
  // holding a resolved-null promise forever, and every later 401, including
  // ones after a successful login, would skip the refresh and force a logout.
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight ??= (async () => {
    const { setToken, clearAuth } = useAuthStore.getState();

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
        clearAuth();
        return null;
      }

      setToken(nextAccess, nextRefresh);
      return nextAccess;
    } catch {
      clearAuth();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Response Interceptor: unwrap the envelope; on 401, refresh once and replay
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
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

    useAuthStore.getState().clearAuth();
    window.location.replace("/login");

    return Promise.reject(error);
  },
);
