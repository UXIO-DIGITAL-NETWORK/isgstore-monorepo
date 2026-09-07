import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, waitFor, makeUser } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";
import type { AuthApiResponse } from "../types/auth.type";

vi.mock("../services/auth.service", () => ({
  authService: { login: vi.fn(), logout: vi.fn() },
}));

const mockUser = makeUser();

// The confirmed staging login envelope (system_architecture.md §1.1).
const envelope: AuthApiResponse = {
  status: "success",
  code: 200,
  message: "Login successful",
  data: { user: mockUser, access_token: "at-123", refresh_token: "rt-456" },
};

const fillAndSubmitLogin = async () => {
  const user = userEvent.setup();
  const utils = await renderRoute("/login");
  await user.type(screen.getByLabelText("Email"), "admin@example.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  return utils;
};

describe("useLogin", () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("sends the detected browser timezone alongside the form values", async () => {
    vi.mocked(authService.login).mockResolvedValue(envelope);

    await fillAndSubmitLogin();

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "admin@example.com",
          password: "secret123",
          // Computed the same way the app detects it — jsdom returns the
          // host timezone, so never hard-code a value here.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      ),
    );
  });

  it("stores both tokens, the user, and role-derived permissions on success", async () => {
    vi.mocked(authService.login).mockResolvedValue(envelope);

    const { router } = await fillAndSubmitLogin();

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.token).toBe("at-123");
      expect(state.refreshToken).toBe("rt-456");
      expect(state.user).toEqual(mockUser);
      expect(state.permissions).toEqual(["*"]);
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/dashboard"));
  });
});
