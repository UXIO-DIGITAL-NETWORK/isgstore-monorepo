import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { ProductTabsLayout } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products")({
  beforeLoad: () => requirePermission("products.view"),
  component: ProductTabsLayout,
});
