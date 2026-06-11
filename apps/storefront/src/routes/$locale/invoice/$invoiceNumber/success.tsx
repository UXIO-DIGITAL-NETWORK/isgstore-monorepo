import { createFileRoute } from "@tanstack/react-router";
import { PaymentSuccessPage } from "@/features/invoice";

export const Route = createFileRoute("/$locale/invoice/$invoiceNumber/success")({
  component: PaymentSuccessPage,
});
