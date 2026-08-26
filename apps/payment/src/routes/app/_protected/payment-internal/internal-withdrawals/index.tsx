import { createFileRoute } from "@tanstack/react-router";
import { InternalWithdrawalsPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/internal-withdrawals/")({
  beforeLoad: () => requirePaymentInternal(),
  component: InternalWithdrawalsPage,
});
