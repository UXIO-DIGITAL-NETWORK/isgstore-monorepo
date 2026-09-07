import { createFileRoute } from "@tanstack/react-router";
import { FinanceTransactionsPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/transactions/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceTransactionsPage,
});
