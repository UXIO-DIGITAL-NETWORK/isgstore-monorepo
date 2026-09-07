import { createFileRoute } from "@tanstack/react-router";
import UpgradeMembershipPage from "@/features/member-dashboard/pages/UpgradeMembershipPage";

export const Route = createFileRoute("/$locale/_member/upgrade-membership/")({
  component: UpgradeMembershipPage,
});
