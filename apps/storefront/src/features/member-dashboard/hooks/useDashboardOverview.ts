import {
  MOCK_MEMBER_PROFILE,
  MOCK_WALLET,
  MOCK_TRANSACTION_STATS,
  MOCK_RECENT_TRANSACTIONS,
} from "@/features/member-dashboard/data/dashboard.mock";
import type {
  MemberProfile,
  WalletInfo,
  TransactionStat,
  RecentTransaction,
} from "@/features/member-dashboard/types/dashboard.type";

interface UseDashboardOverviewReturn {
  profile: MemberProfile;
  wallet: WalletInfo;
  stats: TransactionStat[];
  recentTransactions: RecentTransaction[];
}

export function useDashboardOverview(): UseDashboardOverviewReturn {
  return {
    profile: MOCK_MEMBER_PROFILE,
    wallet: MOCK_WALLET,
    stats: MOCK_TRANSACTION_STATS,
    recentTransactions: MOCK_RECENT_TRANSACTIONS,
  };
}
