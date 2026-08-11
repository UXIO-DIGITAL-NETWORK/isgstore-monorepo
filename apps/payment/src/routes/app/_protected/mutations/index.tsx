import { createFileRoute } from "@tanstack/react-router";
import { MerchantMutationsPage } from "@/features/merchant";
import { requireMerchant } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/mutations/")({
  beforeLoad: () => requireMerchant(),
  component: MerchantMutationsPage,
});
