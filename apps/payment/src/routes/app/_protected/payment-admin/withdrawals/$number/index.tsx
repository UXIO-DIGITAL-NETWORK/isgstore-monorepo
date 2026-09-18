import { createFileRoute } from "@tanstack/react-router";
import { MerchantWithdrawalDetailPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/withdrawals/$number/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

function RouteComponent() {
  const { number } = Route.useParams();

  return <MerchantWithdrawalDetailPage number={number} />;
}
