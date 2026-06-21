import { createFileRoute } from "@tanstack/react-router";
import AccountSettingsPage from "@/features/member-dashboard/pages/AccountSettingsPage";

export const Route = createFileRoute("/$locale/_member/pengaturan-akun/")({
  component: AccountSettingsPage,
});
