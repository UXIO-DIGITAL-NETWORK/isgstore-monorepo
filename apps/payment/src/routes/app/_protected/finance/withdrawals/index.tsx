import { createFileRoute } from "@tanstack/react-router";
import { FinanceWithdrawalsPage } from "@/features/finance";
import { requireFinance } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/finance/withdrawals/")({
  beforeLoad: () => requireFinance(),
  component: FinanceWithdrawalsPage,
});
