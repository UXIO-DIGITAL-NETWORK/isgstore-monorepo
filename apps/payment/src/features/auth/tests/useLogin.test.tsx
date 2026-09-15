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

  it("sends the platform timezone rather than the browser's", async () => {
    vi.mocked(authService.login).mockResolvedValue(envelope);

    await fillAndSubmitLogin();

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "admin@example.com",
          password: "secret123",
          // A literal, not the host's zone: the platform renders one wall
          // clock, so the value sent must not depend on the CI box.
          timezone: "Asia/Jakarta",
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
      // payment-admin role → the "payment-admin" permission (see @/constants/roles).
      expect(state.permissions).toEqual(["payment-admin"]);
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/app/dashboard"));
  });
});
