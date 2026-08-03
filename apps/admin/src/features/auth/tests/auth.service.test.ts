import { describe, it, expect, vi } from "vitest";

import { api } from "@/lib/axios";
import { authService } from "../services/auth.service";

// auth.service is the only service that actually hits the network; mock the
// shared axios instance so no request leaves the test.
vi.mock("@/lib/axios", () => ({
  api: { post: vi.fn() },
}));

describe("authService.login", () => {
  it("posts to /v1/auth/login with the form values plus a timezone string", async () => {
    await authService.login({
      email: "admin@example.com",
      password: "secret123",
      remember: false,
      timezone: "Asia/Jakarta",
    });

    expect(api.post).toHaveBeenCalledWith("/v1/auth/login", {
      email: "admin@example.com",
      password: "secret123",
      remember: false,
      timezone: "Asia/Jakarta",
    });
  });
});

describe("authService.logout", () => {
  // The endpoint lives under the auth group. A bare "/logout" resolved to
  // /api/logout, which does not exist — the session was only ever cleared
  // client-side and the token stayed valid server-side until it expired.
  it("posts to /v1/auth/logout", async () => {
    await authService.logout();

    expect(api.post).toHaveBeenCalledWith("/v1/auth/logout");
  });
});
