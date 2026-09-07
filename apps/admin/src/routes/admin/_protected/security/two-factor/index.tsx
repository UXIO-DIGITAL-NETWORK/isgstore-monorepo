import { createFileRoute } from "@tanstack/react-router";
import TwoFactorSetupPage from "@/features/auth/pages/TwoFactorSetupPage";

// Deliberately not behind `requirePermission`: an admin refused by the API for
// want of a second factor is sent here, and gating it would strand them.
export const Route = createFileRoute("/admin/_protected/security/two-factor/")({
  component: TwoFactorSetupPage,
});
