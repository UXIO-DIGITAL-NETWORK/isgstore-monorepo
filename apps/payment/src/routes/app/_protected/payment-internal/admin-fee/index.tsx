import { createFileRoute } from "@tanstack/react-router";
import { AdminFeeSettingPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/admin-fee/")({
  beforeLoad: () => requirePaymentInternal(),
  component: AdminFeeSettingPage,
});
