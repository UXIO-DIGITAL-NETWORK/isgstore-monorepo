import React from "react";
import { Box } from "@/components/common/Box";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { useDashboardOverview } from "@/features/member-dashboard/hooks/useDashboardOverview";
import MembershipUpgradeBanner from "@/features/member-dashboard/components/MembershipUpgradeBanner";
import MemberIdCard from "@/features/member-dashboard/components/MemberIdCard";
import WalletCard from "@/features/member-dashboard/components/WalletCard";
import TransactionStatsGrid from "@/features/member-dashboard/components/TransactionStatsGrid";
import RecentTransactionsTable from "@/features/member-dashboard/components/RecentTransactionsTable";

function DashboardSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="flex flex-col gap-6">
      <Box className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-44 flex-1 rounded-2xl" />
        <Skeleton className="h-44 flex-1 rounded-2xl" />
      </Box>
      <Box className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </Box>
      <Skeleton className="h-56 w-full rounded-2xl" />
    </Box>
  );
}

export default function DashboardOverviewPage(): React.JSX.Element {
  const { profile, wallet, stats, recentTransactions, query } = useDashboardOverview();

  return (
    <Box className="flex flex-col gap-6">
      {/* Membership upgrade banner */}
      <MembershipUpgradeBanner />

      <QueryState query={query} skeleton={<DashboardSkeleton />}>
        {() => (
          <>
            {/* Member ID + Wallet row */}
            <Box className="flex flex-col sm:flex-row gap-4">
              <MemberIdCard profile={profile} />
              <WalletCard wallet={wallet} />
            </Box>

            {/* Transaction stats */}
            <TransactionStatsGrid stats={stats} />

            {/* Recent transactions */}
            <RecentTransactionsTable transactions={recentTransactions} />
          </>
        )}
      </QueryState>
    </Box>
  );
}
