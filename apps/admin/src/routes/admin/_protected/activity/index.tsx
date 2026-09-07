import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { ActivityLogPage } from "@/features/activity";

export const Route = createFileRoute("/admin/_protected/activity/")({
  beforeLoad: () => requirePermission("activity.view"),
  component: ActivityLogPage,
});
