import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import DashboardOverviewPage from "@/features/member-dashboard/pages/DashboardOverviewPage";

function DashboardPreview() {
  return (
    <MemberLayout>
      <DashboardOverviewPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/dashboard-preview/")({
  component: DashboardPreview,
});
