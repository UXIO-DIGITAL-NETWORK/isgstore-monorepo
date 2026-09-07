import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { ReportsPage } from "@/features/reports";

export const Route = createFileRoute("/admin/_protected/reports/")({
  beforeLoad: () => requirePermission("reports.view"),
  component: ReportsPage,
});
