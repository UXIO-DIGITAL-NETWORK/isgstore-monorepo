import { createFileRoute } from "@tanstack/react-router";
import { AutomaticTransactionsPage } from "@/features/transactions";

export const Route = createFileRoute("/_preview/transaction-preview/")({
  component: AutomaticTransactionsPage,
});
