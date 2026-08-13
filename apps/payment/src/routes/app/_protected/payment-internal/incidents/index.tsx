import { createFileRoute } from "@tanstack/react-router";
import { FinanceIncidentsPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/incidents/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceIncidentsPage,
});
