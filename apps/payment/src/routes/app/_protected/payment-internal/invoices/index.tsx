import { createFileRoute } from "@tanstack/react-router";
import { FinanceInvoicesPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/invoices/")({
  beforeLoad: () => requirePaymentInternal(),
  component: FinanceInvoicesPage,
});
