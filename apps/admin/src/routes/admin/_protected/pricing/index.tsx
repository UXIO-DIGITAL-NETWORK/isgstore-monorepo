import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { PricingRulesPage } from "@/features/pricing";

export const Route = createFileRoute("/admin/_protected/pricing/")({
  beforeLoad: () => requirePermission("pricing.view"),
  component: PricingRulesPage,
});
