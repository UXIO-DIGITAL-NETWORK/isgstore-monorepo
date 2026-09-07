import { createFileRoute } from "@tanstack/react-router";
import { MerchantServicesPage, SERVICES_TABS, type ServicesTab } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/app/_protected/payment-admin/services/")({
  // An unknown or absent ?tab falls back rather than throwing: a stale bookmark
  // must land on the page, not on an error boundary.
  validateSearch: (search: Record<string, unknown>): { tab?: ServicesTab } =>
    SERVICES_TABS.includes(search.tab as ServicesTab) ? { tab: search.tab as ServicesTab } : {},
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

// The page stays prop-driven so it remains unit-testable as a bare render —
// `useSearch` inside it would throw without a router.
function RouteComponent() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MerchantServicesPage
      tab={tab}
      // replace: switching a tab is not a history entry worth a Back press.
      onTabChange={(next) => navigate({ search: { tab: next }, replace: true })}
    />
  );
}
