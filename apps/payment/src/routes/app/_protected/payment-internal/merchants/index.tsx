import { createFileRoute } from "@tanstack/react-router";
import { FinanceMerchantsPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/merchants/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceMerchantsPage,
});
