import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import UpgradeMembershipPage from "@/features/member-dashboard/pages/UpgradeMembershipPage";

function UpgradeMembershipPreview() {
  return (
    <MemberLayout>
      <UpgradeMembershipPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/upgrade-membership-preview/")({
  component: UpgradeMembershipPreview,
});
