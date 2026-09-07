import { createFileRoute } from "@tanstack/react-router";
import ActivityLogPage from "@/features/member-dashboard/pages/ActivityLogPage";

export const Route = createFileRoute("/$locale/_member/log-aktivitas/")({
  component: ActivityLogPage,
});
