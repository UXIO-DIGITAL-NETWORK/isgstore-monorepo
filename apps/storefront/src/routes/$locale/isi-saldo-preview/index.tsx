import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import IsiSaldoPage from "@/features/member-dashboard/pages/IsiSaldoPage";

function IsiSaldoPreview() {
  return (
    <MemberLayout>
      <IsiSaldoPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/isi-saldo-preview/")({
  component: IsiSaldoPreview,
});
