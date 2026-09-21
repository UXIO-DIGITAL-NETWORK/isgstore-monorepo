import { describe, it, expect, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/models/user.model";
import { authService } from "../services/auth.service";

/**
 * Enrolment as the last step of signing in.
 *
 * The behaviour worth pinning is not the QR code — it is that an admin owing a
 * factor never reaches the dashboard, and that confirming stores the session
 * the API hands back. Skipping that store leaves the cookie holding a token the
 * API destroyed a moment earlier, and every subsequent request 401s.
 */
const admin = (patch: Partial<User> = {}): User =>
  ({
    id: 1,
    role_id: 1,
    name: "Admin",
    email: "admin@example.test",
    two_factor_required: true,
    two_factor_enabled: false,
    ...patch,
  }) as User;

const session = (user: User) => ({
  status: "success",
  code: 200,
  message: "ok",
  data: { user, access_token: "fresh-access", refresh_token: "fresh-refresh" },
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("post-login enrolment", () => {
  it("sends an admin who has not enrolled to the enrolment screen, not the dashboard", async () => {
    vi.spyOn(authService, "login").mockResolvedValue(session(admin()) as never);

    const user = userEvent.setup();
    const { router } = await renderRoute("/login");

    await user.type(await screen.findByLabelText(/email/i), "admin@example.test");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("heading", { name: /one more step/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/two-factor-setup");
  });

  it("stores the session the confirmation hands back", async () => {
    // Confirming revokes every token, this one included. The response carries
    // the replacement pair, so failing to store it logs the admin straight out.
    useAuthStore.setState({ token: "stale", user: admin(), permissions: ["*"] });

    vi.spyOn(authService, "setupTwoFactor").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { secret: "JBSWY3DPEHPK3PXP", otpauth_uri: "otpauth://totp/TopupGame:admin?secret=JBSWY3DPEHPK3PXP" },
    } as never);
    const confirm = vi
      .spyOn(authService, "confirmTwoFactor")
      .mockResolvedValue(session(admin({ two_factor_enabled: true })) as never);

    const user = userEvent.setup();
    await renderRoute("/two-factor-setup");

    await user.click(await screen.findByRole("button", { name: /start setup/i }));

    // The secret is offered as text as well as a QR — the fallback when a
    // camera fails or someone enrols a desktop authenticator.
    expect(await screen.findByDisplayValue("JBSWY3DPEHPK3PXP")).toBeInTheDocument();

    // Six digits complete the code, and the last one submits. `InputOTP`
    // renders the secret field alongside its slots, so take the last textbox.
    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[boxes.length - 1], "123456");

    expect(confirm).toHaveBeenCalledWith("123456");
    expect(useAuthStore.getState().token).toBe("fresh-access");
    expect(useAuthStore.getState().user?.two_factor_enabled).toBe(true);
  });

  it("offers a way out so the screen is never a trap", async () => {
    // An admin who cannot reach their phone right now must be able to leave.
    useAuthStore.setState({ token: "token", user: admin(), permissions: ["*"] });

    const user = userEvent.setup();
    await renderRoute("/two-factor-setup");

    await user.click(await screen.findByRole("button", { name: /sign out/i }));

    expect(useAuthStore.getState().token).toBeNull();
  });
});
