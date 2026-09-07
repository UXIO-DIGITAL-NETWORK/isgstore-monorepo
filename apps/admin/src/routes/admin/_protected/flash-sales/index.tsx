import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { FlashSaleListPage } from "@/features/marketing";

export const Route = createFileRoute("/admin/_protected/flash-sales/")({
  beforeLoad: () => requirePermission("marketing.view"),
  component: FlashSaleListPage,
});
