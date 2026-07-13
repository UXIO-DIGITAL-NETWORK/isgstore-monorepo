import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { api } from "@/lib/axios";
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

describe("api response interceptor (401 handling)", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "seeded-token" });
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("keeps the session when the login request itself fails with 401 (wrong password)", async () => {
    await expect(api.post("/auth/login", {}, { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().token).toBe("seeded-token");
  });

  it("clears the session when any other request fails with 401 (expired token)", async () => {
    await expect(api.get("/transactions", { adapter: reject401 })).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().token).toBeNull();
  });
});
