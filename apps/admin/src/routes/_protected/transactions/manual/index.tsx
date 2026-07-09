import { createFileRoute } from "@tanstack/react-router";
import { ManualTransactionsPage } from "@/features/transactions";

export const Route = createFileRoute("/_protected/transactions/manual/")({
  component: ManualTransactionsPage,
});
