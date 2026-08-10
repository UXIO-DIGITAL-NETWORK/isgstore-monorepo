import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { toHistoryRow } from "@/features/member-dashboard/lib/mappers";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { TransactionHistoryRow } from "@/features/member-dashboard/types/dashboard.type";

/** One page holds the whole table; the panel filters and sorts client-side. */
const PER_PAGE = 100;

export function useTransactionHistory(): TransactionHistoryRow[] {
  // Realtime (useMemberTransactionsRealtime) drives updates; only poll as a
  // safety net while the socket is down, otherwise not at all.
  const connected = useEchoConnected();

  const { data } = useQuery({
    queryKey: ["member", "transactions"],
    queryFn: async () => (await memberService.transactions({ per_page: PER_PAGE })).data,
    refetchInterval: connected ? false : 30_000,
  });

  return (data?.data ?? []).map(toHistoryRow);
}
