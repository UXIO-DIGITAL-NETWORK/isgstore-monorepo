import { createFileRoute } from "@tanstack/react-router";
import { FinanceServicesPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/services/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceServicesPage,
});
