import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// setup.ts swaps `@/lib/axios` for a fake backend so page tests have something
// to render. This file is testing the real interceptors, so it opts back out.
vi.unmock("@/lib/axios");

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";

// Rejects like a real 401 from the server without any network: a per-request
// adapter whose AxiosError carries the config/url the response interceptor
// inspects. window.location.replace can't be stubbed in jsdom (Location
// members are unforgeable), so assertions target the store side effect.
const reject401 = (config: InternalAxiosRequestConfig) =>
  Promise.reject(
    new AxiosError("Unauthorized", AxiosError.ERR_BAD_REQUEST, config, undefined, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
      data: { status: "error", message: "Unauthenticated.", errors: {} },
    }),
  );

/** 401 once per config, then succeed — models a replay after a refresh. */
const reject401Once = () => {
  const seen = new Set<string>();
  return (config: InternalAxiosRequestConfig) => {
    const key = String(config.url);
    if (seen.has(key)) {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: { status: "success", code: 200, message: "ok", data: { replayed: true } },
      });
    }
    seen.add(key);
    return reject401(config);
  };
};

describe("api response interceptor (401 handling)", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "seeded-token", refreshToken: null });
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  it("keeps the session when the login request itself fails with 401 (wrong password)", async () => {
    await expect(api.post(`${API_VERSION}/auth/login`, {}, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().token).toBe("seeded-token");
  });

  it("clears the session when a 401 arrives and there is no refresh token to try", async () => {
    await expect(api.get(`${API_VERSION}/transactions`, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().token).toBeNull();
  });

  it("refreshes the token and replays the original request once", async () => {
    useAuthStore.setState({ token: "expired-token", refreshToken: "refresh-me" });

    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { access_token: "fresh-token", refresh_token: "fresh-refresh" } },
    });

    const result = await api.get(`${API_VERSION}/transactions`, { adapter: reject401Once() });

    expect(post).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ data: { replayed: true } });
    expect(useAuthStore.getState().token).toBe("fresh-token");
    expect(useAuthStore.getState().refreshToken).toBe("fresh-refresh");
  });

  it("shares a single refresh across concurrent 401s instead of one per request", async () => {
    useAuthStore.setState({ token: "expired-token", refreshToken: "refresh-me" });

    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { access_token: "fresh-token", refresh_token: "fresh-refresh" } },
    });

    await Promise.all([
      api.get(`${API_VERSION}/transactions`, { adapter: reject401Once() }),
      api.get(`${API_VERSION}/products`, { adapter: reject401Once() }),
      api.get(`${API_VERSION}/categories`, { adapter: reject401Once() }),
    ]);

    // Three concurrent 401s, one refresh. Without the shared in-flight promise
    // the first would rotate the token and the other two would refresh against
    // a refresh token that no longer exists, logging the admin out mid-session.
    expect(post).toHaveBeenCalledOnce();
  });

  it("clears the session when the refresh itself fails", async () => {
    useAuthStore.setState({ token: "expired-token", refreshToken: "stale-refresh" });

    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh rejected"));

    await expect(api.get(`${API_VERSION}/transactions`, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  // Regression: the early `return null` for a missing refresh token used to sit
  // outside the try/finally, so the module-level `refreshInFlight` stayed
  // pinned to a resolved-null promise. A single 401 while signed out then
  // disabled refresh permanently — the next expired token logged the admin out
  // instead of renewing.
  it("still refreshes after an earlier 401 that had no refresh token to use", async () => {
    useAuthStore.setState({ token: "seeded-token", refreshToken: null });
    await expect(api.get(`${API_VERSION}/transactions`, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    useAuthStore.setState({ token: "expired-token", refreshToken: "refresh-me" });
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { access_token: "fresh-token", refresh_token: "fresh-refresh" } },
    });

    await api.get(`${API_VERSION}/products`, { adapter: reject401Once() });

    expect(post).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().token).toBe("fresh-token");
  });

  it("never tries to refresh an auth request, which would recurse", async () => {
    useAuthStore.setState({ token: "expired-token", refreshToken: "refresh-me" });

    const post = vi.spyOn(axios, "post");

    await expect(api.post(`${API_VERSION}/auth/refresh`, {}, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(post).not.toHaveBeenCalled();
  });
});

describe("api request interceptor (FormData Content-Type)", () => {
  beforeEach(() => useAuthStore.setState({ token: "seeded-token", refreshToken: null }));
  afterEach(() => useAuthStore.getState().clearAuth());

  const captureContentType = (sink: { value: string | null }) => (config: InternalAxiosRequestConfig) => {
    sink.value = config.headers?.get?.("Content-Type")?.toString() ?? null;
    return Promise.resolve({
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      data: { status: "success", code: 200, message: "ok", data: {} },
    });
  };

  it("drops the JSON Content-Type for FormData so the browser can set multipart", async () => {
    const sink: { value: string | null } = { value: null };
    const form = new FormData();
    form.append("_method", "PUT");
    form.append("logo", new File(["x"], "logo.png", { type: "image/png" }));

    await api.post(`${API_VERSION}/payment-channels/1`, form, { adapter: captureContentType(sink) });

    // Was application/json → the logo upload arrived unparseable. Now dropped;
    // a real browser sets `multipart/form-data; boundary=…` itself.
    expect(sink.value ?? "").not.toMatch(/application\/json/);
  });

  it("keeps application/json for a plain-object body", async () => {
    const sink: { value: string | null } = { value: null };

    await api.put(`${API_VERSION}/settings`, { settings: {} }, { adapter: captureContentType(sink) });

    expect(sink.value ?? "").toMatch(/application\/json/);
  });
});
