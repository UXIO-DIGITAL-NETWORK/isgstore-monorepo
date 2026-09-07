import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { TransactionsLayout } from "@/features/transactions";

export const Route = createFileRoute("/admin/_protected/transactions")({
  beforeLoad: () => requirePermission("transactions.view"),
  component: TransactionsLayout,
});
