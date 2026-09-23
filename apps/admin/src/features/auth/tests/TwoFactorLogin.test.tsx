import { describe, it, expect, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../services/auth.service";

/**
 * The second login step. What matters is that the challenge never becomes a
 * session and never reaches the auth store — `requireGuest` bounces anyone the
 * store considers signed in, so storing it would break the very screen that
 * needs it.
 */
afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("two-factor login", () => {
  it("asks for a code instead of signing in, and stores no session yet", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { two_factor_required: true, challenge_token: "challenge-abc" },
    } as never);

    const user = userEvent.setup();
    await renderRoute("/login");

    await user.type(await screen.findByLabelText(/email/i), "admin@example.test");
    // Exact, not /password/i: the field now carries a "Show password" toggle
    // beside it, which a loose matcher would also match.
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("heading", { name: /Two-factor code/i })).toBeInTheDocument();
    // The challenge is not a session.
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("exchanges a six-digit code for a real session", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { two_factor_required: true, challenge_token: "challenge-abc" },
    } as never);

    const verify = vi.spyOn(authService, "verifyTwoFactor").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: {
        user: { id: 1, name: "Admin", email: "admin@example.test", role_id: 1 },
        access_token: "real-access",
        refresh_token: "real-refresh",
      },
    } as never);

    const user = userEvent.setup();
    await renderRoute("/login");

    await user.type(await screen.findByLabelText(/email/i), "admin@example.test");
    // Exact, not /password/i: the field now carries a "Show password" toggle
    // beside it, which a loose matcher would also match.
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByRole("heading", { name: /Two-factor code/i });

    // Six digits complete the code, and the form submits on the last one.
    const slots = screen.getAllByRole("textbox");
    await user.type(slots[0], "123456");

    expect(verify).toHaveBeenCalledWith("challenge-abc", "123456");
  });
});
