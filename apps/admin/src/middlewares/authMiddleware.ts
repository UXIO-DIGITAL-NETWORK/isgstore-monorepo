import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

// Middleware for route that requires authentication
export const requireAuth = () => {
  const { token } = useAuthStore.getState();
  if (!token) {
    throw redirect({ to: "/login" });
  }
};

/** Where an admin who has not enrolled an authenticator is sent. */
export const TWO_FACTOR_SETUP_ROUTE = "/two-factor-setup";

/**
 * Enrolment is a step inside signing in, not a page in the panel.
 *
 * The decision is read off the user the API described — `two_factor_required`
 * comes from `UserResource`, so the panel can never disagree with
 * `EnsureTwoFactorSatisfied` about who owes a factor.
 *
 * This is routing, not authorisation. The cookie it reads is the person's own
 * to edit; forging it buys them an empty dashboard where every request 403s.
 * Never move an access decision behind this check.
 */
export const requireTwoFactorSatisfied = () => {
  const { user } = useAuthStore.getState();
  if (user?.two_factor_required && !user.two_factor_enabled) {
    throw redirect({ to: TWO_FACTOR_SETUP_ROUTE });
  }
};

/** The mirror image: nobody who has already enrolled belongs on that screen. */
export const requireTwoFactorPending = () => {
  const { user } = useAuthStore.getState();
  // A user we know nothing about (a session predating this release, whose
  // `auth_user` cookie carries no 2FA fields) is left alone rather than
  // bounced — the axios 403 branch still catches them.
  if (!user?.two_factor_required || user.two_factor_enabled) {
    throw redirect({ to: "/admin/dashboard" });
  }
};

// Middleware for route that requires guest
export const requireGuest = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    throw redirect({ to: "/admin/dashboard" });
  }
};

// Middleware for route that requires a specific permission (resource.action).
// Wildcard ("*", held by super-admin) grants everything — see
// system_architecture.md §5.
export const requirePermission = (permission: string) => {
  const { permissions } = useAuthStore.getState();
  const allowed = permissions.includes("*") || permissions.includes(permission);
  if (!allowed) {
    throw redirect({ to: "/admin/dashboard" });
  }
};
