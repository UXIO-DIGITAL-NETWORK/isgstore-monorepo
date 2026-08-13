import { createFileRoute } from "@tanstack/react-router";
import { FinanceSubscriptionDetailPage } from "@/features/finance";
import { requirePaymentInternal } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-internal/subscriptions/$subscriptionId/")({
  beforeLoad: () => requirePaymentInternal(),
  component: RouteComponent,
});

function RouteComponent() {
  const { subscriptionId } = Route.useParams();

  return <FinanceSubscriptionDetailPage subscriptionId={Number(subscriptionId)} />;
}
