import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireTwoFactorSatisfied } from "@/middlewares/authMiddleware";
import { DashboardLayout } from "@/features/dashboard/layouts/DashboardLayout";

export const Route = createFileRoute("/admin/_protected")({
  // Order matters: no token at all is a redirect to login, and only a
  // signed-in admin owing a second factor is sent to enrol.
  beforeLoad: () => {
    requireAuth();
    requireTwoFactorSatisfied();
  },
  component: DashboardLayout,
});
