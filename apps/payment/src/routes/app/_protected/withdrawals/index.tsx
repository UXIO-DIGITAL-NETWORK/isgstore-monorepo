import { createFileRoute } from "@tanstack/react-router";
import { MerchantWithdrawalsPage } from "@/features/merchant";
import { requireMerchant } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/withdrawals/")({
  beforeLoad: () => requireMerchant(),
  component: MerchantWithdrawalsPage,
});
