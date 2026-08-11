import { createFileRoute } from "@tanstack/react-router";
import { FinanceWithdrawalsPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/withdrawals/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceWithdrawalsPage,
});
