import { createFileRoute } from "@tanstack/react-router";
import { MerchantServicesPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/services/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: MerchantServicesPage,
});
