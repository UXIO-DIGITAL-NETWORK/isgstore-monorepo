import { createFileRoute } from "@tanstack/react-router";
import { PaymentFailedPage } from "@/features/invoice";

export const Route = createFileRoute("/$locale/invoice/$invoiceNumber/failed")({
  component: PaymentFailedPage,
});
