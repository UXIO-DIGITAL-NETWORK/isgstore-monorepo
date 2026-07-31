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
  refreshInFlight ??= (async () => {
    const { refreshToken, setToken, clearAuth } = useAuthStore.getState();

    if (!refreshToken) return null;

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

function redirectToLogin(): void {
  const locale = window.location.pathname.split("/")[1] || "id";
  window.location.replace(`/${locale}/login`);
}

api.interceptors.response.use(
  // Unwrap to the response body, so callers work with the API envelope
  // directly instead of reaching through `response.data` every time.
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

    // Only bounce someone who actually had a session. A guest whose request
    // happened to 401 must not be thrown onto the login page mid-checkout.
    const { token: currentToken, refreshToken: currentRefresh, clearAuth } = useAuthStore.getState();

    if (currentToken || currentRefresh) {
      clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);
