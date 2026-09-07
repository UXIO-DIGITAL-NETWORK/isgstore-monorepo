import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { CategoryTabsLayout } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories")({
  beforeLoad: () => requirePermission("categories.view"),
  component: CategoryTabsLayout,
});
