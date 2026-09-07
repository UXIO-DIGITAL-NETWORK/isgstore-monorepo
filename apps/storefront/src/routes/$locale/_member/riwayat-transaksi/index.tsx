import { createFileRoute } from "@tanstack/react-router";
import TransactionHistoryPage from "@/features/member-dashboard/pages/TransactionHistoryPage";

export const Route = createFileRoute("/$locale/_member/riwayat-transaksi/")({
  component: TransactionHistoryPage,
});
