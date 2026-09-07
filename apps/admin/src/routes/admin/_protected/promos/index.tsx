import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { PromoListPage } from "@/features/marketing";

export const Route = createFileRoute("/admin/_protected/promos/")({
  beforeLoad: () => requirePermission("marketing.view"),
  component: PromoListPage,
});
