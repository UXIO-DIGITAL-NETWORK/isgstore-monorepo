import { createFileRoute } from "@tanstack/react-router";
import { MerchantServiceInvoiceDetailPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/service-invoices/$invoiceId/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

function RouteComponent() {
  const { invoiceId } = Route.useParams();

  return <MerchantServiceInvoiceDetailPage invoiceId={Number(invoiceId)} />;
}
