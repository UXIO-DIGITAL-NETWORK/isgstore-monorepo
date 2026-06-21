import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import ActivityLogPage from "@/features/member-dashboard/pages/ActivityLogPage";

function LogAktivitasPreview() {
  return (
    <MemberLayout>
      <ActivityLogPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/log-aktivitas-preview/")({
  component: LogAktivitasPreview,
});
