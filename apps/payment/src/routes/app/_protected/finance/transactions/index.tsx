import { createFileRoute } from "@tanstack/react-router";
import { FinanceTransactionsPage } from "@/features/finance";
import { requireFinance } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/finance/transactions/")({
  beforeLoad: () => requireFinance(),
  component: FinanceTransactionsPage,
});
