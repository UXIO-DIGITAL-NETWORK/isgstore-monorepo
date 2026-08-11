import { createFileRoute } from "@tanstack/react-router";
import { FinanceMerchantsPage } from "@/features/finance";
import { requireFinance } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/finance/merchants/")({
  beforeLoad: () => requireFinance(),
  component: FinanceMerchantsPage,
});
