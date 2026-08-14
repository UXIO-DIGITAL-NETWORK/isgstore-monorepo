import { createFileRoute } from "@tanstack/react-router";
import { FinanceInvoiceDetailPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/invoices/$invoiceId/")({
  beforeLoad: () => requirePaymentInternal(),
  component: RouteComponent,
});

// The param is read here and passed down as a prop: every page test renders the
// page bare, with no RouterProvider, so useParams inside the page would throw.
function RouteComponent() {
  const { invoiceId } = Route.useParams();

  return <FinanceInvoiceDetailPage invoiceId={Number(invoiceId)} />;
}
