import { createFileRoute } from "@tanstack/react-router";
import { MemberLayout } from "@/features/member-dashboard/layouts/MemberLayout";
import TransactionHistoryPage from "@/features/member-dashboard/pages/TransactionHistoryPage";

function RiwayatTransaksiPreview() {
  return (
    <MemberLayout>
      <TransactionHistoryPage />
    </MemberLayout>
  );
}

export const Route = createFileRoute("/$locale/riwayat-transaksi-preview/")({
  component: RiwayatTransaksiPreview,
});
