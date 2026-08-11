import { createFileRoute } from "@tanstack/react-router";
import { MerchantTransactionsPage } from "@/features/merchant";
import { requireMerchant } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/transactions/")({
  beforeLoad: () => requireMerchant(),
  component: MerchantTransactionsPage,
});
