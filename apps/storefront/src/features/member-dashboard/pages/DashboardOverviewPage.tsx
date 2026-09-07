import React from "react";
import { Box } from "@/components/common/Box";
import { useDashboardOverview } from "@/features/member-dashboard/hooks/useDashboardOverview";
import MembershipUpgradeBanner from "@/features/member-dashboard/components/MembershipUpgradeBanner";
import MemberIdCard from "@/features/member-dashboard/components/MemberIdCard";
import WalletCard from "@/features/member-dashboard/components/WalletCard";
import TransactionStatsGrid from "@/features/member-dashboard/components/TransactionStatsGrid";
import RecentTransactionsTable from "@/features/member-dashboard/components/RecentTransactionsTable";

export default function DashboardOverviewPage(): React.JSX.Element {
  const { profile, wallet, stats, recentTransactions } = useDashboardOverview();

  return (
    <Box className="flex flex-col gap-6">
      {/* Membership upgrade banner */}
      <MembershipUpgradeBanner />

      {/* Member ID + Wallet row */}
      <Box className="flex flex-col sm:flex-row gap-4">
        <MemberIdCard profile={profile} />
        <WalletCard wallet={wallet} />
      </Box>

      {/* Transaction stats */}
      <TransactionStatsGrid stats={stats} />

      {/* Recent transactions */}
      <RecentTransactionsTable transactions={recentTransactions} />
    </Box>
  );
}
