import { createFileRoute } from "@tanstack/react-router";
import DashboardOverviewPage from "@/features/member-dashboard/pages/DashboardOverviewPage";

export const Route = createFileRoute("/$locale/_member/dashboard/")({
  component: DashboardOverviewPage,
});
