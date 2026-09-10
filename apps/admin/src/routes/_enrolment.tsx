import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/auth/layouts/AuthLayout";
import { requireAuth, requireTwoFactorPending } from "@/middlewares/authMiddleware";

/**
 * Signing in is not finished yet.
 *
 * Deliberately its own layout rather than `_auth`: that group carries
 * `requireGuest`, and everyone here is holding a token — the password was
 * accepted, only the second factor is missing. It reuses `AuthLayout` so the
 * screen has no sidebar, because a dashboard chrome around a step the API will
 * refuse every request behind is what made this read as an error rather than
 * as onboarding.
 */
export const Route = createFileRoute("/_enrolment")({
  beforeLoad: () => {
    requireAuth();
    requireTwoFactorPending();
  },
  component: AuthLayout,
});
