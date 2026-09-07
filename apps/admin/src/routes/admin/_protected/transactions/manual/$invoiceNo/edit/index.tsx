import { createFileRoute } from "@tanstack/react-router";
import { EditTransactionPage } from "@/features/transactions";

export const Route = createFileRoute("/admin/_protected/transactions/manual/$invoiceNo/edit/")({
  component: EditTransactionPage,
});
