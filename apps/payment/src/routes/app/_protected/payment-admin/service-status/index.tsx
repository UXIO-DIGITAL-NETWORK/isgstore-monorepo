import { createFileRoute } from "@tanstack/react-router";
import { MerchantServiceStatusPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/service-status/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: MerchantServiceStatusPage,
});
