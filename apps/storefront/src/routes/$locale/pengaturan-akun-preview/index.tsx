import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import AccountSettingsPage from "@/features/member-dashboard/pages/AccountSettingsPage";

function PengaturanAkunPreview() {
  return (
    <MemberLayout>
      <AccountSettingsPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/pengaturan-akun-preview/")({
  component: PengaturanAkunPreview,
});
