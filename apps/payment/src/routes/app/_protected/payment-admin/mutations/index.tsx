import { createFileRoute } from "@tanstack/react-router";
import { MerchantMutationsPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/mutations/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: MerchantMutationsPage,
});
