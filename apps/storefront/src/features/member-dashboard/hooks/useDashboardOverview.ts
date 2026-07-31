import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { toRecentTransaction } from "@/features/member-dashboard/lib/mappers";
import type {
  MemberProfile,
  MembershipLevel,
  RecentTransaction,
  TransactionStat,
  WalletInfo,
} from "@/features/member-dashboard/types/dashboard.type";
import type { UserRole } from "@/types/models/user.model";

interface UseDashboardOverviewReturn {
  profile: MemberProfile;
  wallet: WalletInfo;
  stats: TransactionStat[];
  recentTransactions: RecentTransaction[];
}

/**
 * The API's role ladder rendered as the membership tier the dashboard shows.
 * There is no separate membership table — the role *is* the tier.
 */
const TIER_BY_ROLE: Record<UserRole, MembershipLevel> = {
  member: "Member",
  vip: "Platinum",
  reseller: "Gold",
  agent: "Silver",
  admin: "Member",
};

const EMPTY_PROFILE: MemberProfile = {
  name: "",
  email: "",
  phone: "",
  membershipLevel: "Member",
};

export function useDashboardOverview(): UseDashboardOverviewReturn {
  const user = useAuthStore((state) => state.user);

  const { data } = useQuery({
    queryKey: ["member", "dashboard"],
    queryFn: async () => (await memberService.dashboard()).data,
  });

  const profile: MemberProfile = user
    ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        membershipLevel: TIER_BY_ROLE[user.role ?? "member"] ?? "Member",
        avatarUrl: user.avatar_url ?? undefined,
      }
    : EMPTY_PROFILE;

  return {
    profile,
    wallet: {
      balance: data?.wallet.balance ?? 0,
      points: data?.wallet.points ?? 0,
    },
    // Same six tiles, same order and tones as before — only the numbers are
    // real now. The trend captions are dropped rather than faked: the API has
    // no period-over-period comparison to derive them from.
    stats: [
      { key: "pending", labelKey: "stats.pending", value: data?.stats.pending ?? 0, tone: "pending" },
      { key: "process", labelKey: "stats.inProcess", value: data?.stats.process ?? 0, tone: "process" },
      { key: "success", labelKey: "stats.success", value: data?.stats.success ?? 0, tone: "success" },
      { key: "failed", labelKey: "stats.failed", value: data?.stats.failed ?? 0, tone: "failed" },
      { key: "total", labelKey: "stats.totalTransactions", value: data?.stats.total ?? 0, tone: "neutral" },
      { key: "sales", labelKey: "stats.totalSales", value: data?.total_spent ?? 0, tone: "neutral" },
    ],
    recentTransactions: (data?.recent_transactions ?? []).map(toRecentTransaction),
  };
}
