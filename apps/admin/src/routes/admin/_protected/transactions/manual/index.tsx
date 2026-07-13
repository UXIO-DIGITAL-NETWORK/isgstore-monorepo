import { createFileRoute } from "@tanstack/react-router";
import { ManualTransactionsPage } from "@/features/transactions";

export const Route = createFileRoute("/admin/_protected/transactions/manual/")({
  component: ManualTransactionsPage,
});
