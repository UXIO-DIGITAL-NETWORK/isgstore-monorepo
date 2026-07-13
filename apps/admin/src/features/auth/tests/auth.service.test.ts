import { describe, it, expect, vi } from "vitest";

import { api } from "@/lib/axios";
import { authService } from "../services/auth.service";

// auth.service is the only service that actually hits the network; mock the
// shared axios instance so no request leaves the test.
vi.mock("@/lib/axios", () => ({
  api: { post: vi.fn() },
}));

describe("authService.login", () => {
  it("posts to /auth/login with the form values plus a timezone string", async () => {
    await authService.login({
      email: "admin@example.com",
      password: "secret123",
      remember: false,
      timezone: "Asia/Jakarta",
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "admin@example.com",
      password: "secret123",
      remember: false,
      timezone: "Asia/Jakarta",
    });
  });
});
