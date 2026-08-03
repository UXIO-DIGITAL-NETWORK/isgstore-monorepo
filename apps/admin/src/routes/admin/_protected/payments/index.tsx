import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { PaymentChannelListPage } from "@/features/administration";

export const Route = createFileRoute("/admin/_protected/payments/")({
  beforeLoad: () => requirePermission("payments.view"),
  component: PaymentChannelListPage,
});
