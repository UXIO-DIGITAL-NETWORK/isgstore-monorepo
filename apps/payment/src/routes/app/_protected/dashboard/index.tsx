import { createFileRoute } from "@tanstack/react-router";
import { MerchantDashboardPage } from "@/features/merchant";
import { FinanceDashboardPage } from "@/features/finance";
import { ROLES } from "@/constants/roles";
import { useAuthStore } from "@/store/useAuthStore";

// Shared route; the shell picks the dashboard for the signed-in role.
function RoleDashboard() {
  const role = useAuthStore((state) => state.user?.role);
  return role === ROLES.INTERNAL ? <FinanceDashboardPage /> : <MerchantDashboardPage />;
}

export const Route = createFileRoute("/app/_protected/dashboard/")({
  component: RoleDashboard,
});
