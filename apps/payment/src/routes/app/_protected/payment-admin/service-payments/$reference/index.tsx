import { createFileRoute } from "@tanstack/react-router";

import { MerchantServiceBatchPaymentPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/service-payments/$reference/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

function RouteComponent() {
  const { reference } = Route.useParams();

  return <MerchantServiceBatchPaymentPage reference={reference} />;
}
