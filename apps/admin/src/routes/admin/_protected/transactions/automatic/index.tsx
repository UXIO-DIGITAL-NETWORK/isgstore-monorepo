import { createFileRoute } from "@tanstack/react-router";
import { AutomaticTransactionsPage } from "@/features/transactions";

export const Route = createFileRoute("/admin/_protected/transactions/automatic/")({
  component: AutomaticTransactionsPage,
});
