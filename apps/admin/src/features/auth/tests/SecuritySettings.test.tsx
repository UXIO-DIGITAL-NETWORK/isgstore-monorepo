import { describe, it, expect, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/models/user.model";
import { authService } from "../services/auth.service";

/**
 * Moving the authenticator to another device.
 *
 * Two things are worth pinning. The move costs both the password and a code
 * from the device being replaced — drop either and a hijacked session, or
 * anyone who was once read a code aloud, can take the account. And confirming
 * stores the new session, because the move revokes the one the page was using.
 */
const enrolledAdmin = (patch: Partial<User> = {}): User =>
  ({
    id: 1,
    role_id: 1,
    name: "Admin",
    email: "admin@example.test",
    two_factor_required: true,
    two_factor_enabled: true,
    ...patch,
  }) as User;

const signedIn = (patch: Partial<User> = {}) =>
  useAuthStore.setState({ token: "old-access", user: enrolledAdmin(patch), permissions: ["*"] });

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("security settings", () => {
  it("asks for the password and a live code before issuing a new secret", async () => {
    signedIn();
    const rotate = vi.spyOn(authService, "rotateTwoFactor").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { secret: "NEWSECRET234567A", otpauth_uri: "otpauth://totp/ISG:admin?secret=NEWSECRET234567A" },
    } as never);

    const user = userEvent.setup();
    await renderRoute("/admin/settings/security");

    await user.click(await screen.findByRole("button", { name: /move to another device/i }));
    await user.type(screen.getByLabelText("Your password"), "secret123");
    await user.type(screen.getByLabelText(/current authenticator/i), "654321");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(rotate).toHaveBeenCalledWith("secret123", "654321");

    // The new secret is shown to scan — and only now.
    expect(await screen.findByDisplayValue("NEWSECRET234567A")).toBeInTheDocument();
  });

  it("will not submit the move on a password alone", async () => {
    signedIn();

    const user = userEvent.setup();
    await renderRoute("/admin/settings/security");

    await user.click(await screen.findByRole("button", { name: /move to another device/i }));
    await user.type(screen.getByLabelText("Your password"), "secret123");

    expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
  });

  it("stores the session the confirmed move hands back", async () => {
    signedIn();
    vi.spyOn(authService, "rotateTwoFactor").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { secret: "NEWSECRET234567A", otpauth_uri: "otpauth://totp/ISG:admin?secret=NEWSECRET234567A" },
    } as never);
    const confirm = vi.spyOn(authService, "confirmTwoFactorRotation").mockResolvedValue({
      status: "success",
      code: 200,
      message: "ok",
      data: { user: enrolledAdmin(), access_token: "rotated-access", refresh_token: "rotated-refresh" },
    } as never);

    const user = userEvent.setup();
    await renderRoute("/admin/settings/security");

    await user.click(await screen.findByRole("button", { name: /move to another device/i }));
    await user.type(screen.getByLabelText("Your password"), "secret123");
    await user.type(screen.getByLabelText(/current authenticator/i), "654321");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByDisplayValue("NEWSECRET234567A");

    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[boxes.length - 1], "123456");

    expect(confirm).toHaveBeenCalledWith("123456");
    expect(useAuthStore.getState().token).toBe("rotated-access");
  });

  it("says so when a move was started but never finished", async () => {
    // The secret travels once, so there is no QR left to resume — the page has
    // to be honest that starting again replaces it.
    signedIn({ two_factor_pending: true });

    await renderRoute("/admin/settings/security");

    expect(await screen.findByText(/started but never confirmed/i)).toBeInTheDocument();
  });
});
