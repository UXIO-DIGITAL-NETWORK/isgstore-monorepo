import { createFileRoute } from "@tanstack/react-router";
import { MerchantTransactionsPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/transactions/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: MerchantTransactionsPage,
});
