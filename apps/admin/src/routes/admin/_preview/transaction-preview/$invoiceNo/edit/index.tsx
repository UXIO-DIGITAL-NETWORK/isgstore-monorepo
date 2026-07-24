import { createFileRoute } from "@tanstack/react-router";
import { EditTransactionPage } from "@/features/transactions";

export const Route = createFileRoute("/admin/_preview/transaction-preview/$invoiceNo/edit/")({
  component: EditTransactionPage,
});
