import { createFileRoute } from "@tanstack/react-router";
import { MerchantServiceCheckoutPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/services/$serviceId/checkout/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

// The param is read here and passed down as a prop: every page test renders the
// page bare, with no RouterProvider, so useParams inside the page would throw.
function RouteComponent() {
  const { serviceId } = Route.useParams();

  return <MerchantServiceCheckoutPage serviceId={Number(serviceId)} />;
}
