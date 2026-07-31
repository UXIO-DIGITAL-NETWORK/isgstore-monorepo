import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { toHistoryRow } from "@/features/member-dashboard/lib/mappers";
import type { TransactionHistoryRow } from "@/features/member-dashboard/types/dashboard.type";

/** One page holds the whole table; the panel filters and sorts client-side. */
const PER_PAGE = 100;

export function useTransactionHistory(): TransactionHistoryRow[] {
  const { data } = useQuery({
    queryKey: ["member", "transactions"],
    queryFn: async () => (await memberService.transactions({ per_page: PER_PAGE })).data,
  });

  return (data?.data ?? []).map(toHistoryRow);
}
