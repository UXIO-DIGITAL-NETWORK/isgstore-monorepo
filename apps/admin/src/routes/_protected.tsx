import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/middlewares/authMiddleware";
import { DashboardLayout } from "@/features/dashboard/layouts/DashboardLayout";

export const Route = createFileRoute("/_protected")({
  beforeLoad: () => requireAuth(),
  component: DashboardLayout,
});
