import { createFileRoute } from "@tanstack/react-router";
import { MerchantWithdrawalsPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/withdrawals/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: MerchantWithdrawalsPage,
});
