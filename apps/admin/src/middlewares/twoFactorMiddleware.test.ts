import { describe, it, expect, afterEach } from "vitest";
import type { User } from "@/models/user.model";
import { useAuthStore } from "@/store/useAuthStore";
import { requireTwoFactorPending, requireTwoFactorSatisfied } from "./authMiddleware";

/**
 * The routing half of the second-factor gate.
 *
 * The enforcing is done by the API — `EnsureTwoFactorSatisfied` answers 403 on
 * every admin route. These guards only decide which screen to mount, so what
 * matters is that they agree with the API about who owes a factor: an admin
 * sent to the dashboard sees a shell of failed requests, and an enrolled admin
 * sent to the enrolment screen cannot get out of it.
 */
const asUser = (patch: Partial<User>) =>
  useAuthStore.setState({
    token: "token",
    user: { id: 1, role_id: 1, name: "A", email: "a@b.c", ...patch } as User,
    permissions: ["*"],
  });

/** The guards signal by throwing a redirect; this reports where to. */
const redirectedTo = (guard: () => void): string | null => {
  try {
    guard();

    return null;
  } catch (thrown) {
    // `redirect()` returns the destination under `options`, not on the object.
    return (thrown as { options?: { to?: string } }).options?.to ?? "thrown";
  }
};

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
});

describe("requireTwoFactorSatisfied", () => {
  it("sends an admin who has not enrolled to the enrolment screen", () => {
    asUser({ two_factor_required: true, two_factor_enabled: false });

    expect(redirectedTo(requireTwoFactorSatisfied)).toBe("/two-factor-setup");
  });

  it("lets an enrolled admin through", () => {
    asUser({ two_factor_required: true, two_factor_enabled: true });

    expect(redirectedTo(requireTwoFactorSatisfied)).toBeNull();
  });

  it("does not force a role the API does not require it of", () => {
    asUser({ two_factor_required: false, two_factor_enabled: false });

    expect(redirectedTo(requireTwoFactorSatisfied)).toBeNull();
  });

  it("leaves a session from before this release alone", () => {
    // Its `auth_user` cookie carries no 2FA fields, so the guard has nothing to
    // judge. The axios 403 branch is what catches these — guessing here would
    // strand a member on an admin-only screen.
    asUser({});

    expect(redirectedTo(requireTwoFactorSatisfied)).toBeNull();
  });
});

describe("requireTwoFactorPending", () => {
  it("keeps an admin owing a factor on the enrolment screen", () => {
    asUser({ two_factor_required: true, two_factor_enabled: false });

    expect(redirectedTo(requireTwoFactorPending)).toBeNull();
  });

  it("bounces someone who has already enrolled", () => {
    asUser({ two_factor_required: true, two_factor_enabled: true });

    expect(redirectedTo(requireTwoFactorPending)).toBe("/admin/dashboard");
  });

  it("bounces a role that never needed one", () => {
    asUser({ two_factor_required: false });

    expect(redirectedTo(requireTwoFactorPending)).toBe("/admin/dashboard");
  });
});
