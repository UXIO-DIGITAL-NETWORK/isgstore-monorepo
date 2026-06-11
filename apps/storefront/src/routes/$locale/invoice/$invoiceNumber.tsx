import { createFileRoute } from "@tanstack/react-router";
import { InvoicePage } from "@/features/invoice";

export const Route = createFileRoute("/$locale/invoice/$invoiceNumber")({
  component: InvoicePage,
});
