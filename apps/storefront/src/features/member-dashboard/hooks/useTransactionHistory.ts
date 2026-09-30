import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { asArray, toHistoryRow } from "@/features/member-dashboard/lib/mappers";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { TransactionHistoryRow } from "@/features/member-dashboard/types/dashboard.type";

/** One page holds the whole table; the panel filters and sorts client-side. */
const PER_PAGE = 100;

/**
 * The member's own transaction history.
 *
 * Returns the query alongside the mapped rows so the page can render a table
 * skeleton, an error with retry, and an empty state instead of an empty tbody.
 */
export function useTransactionHistory() {
  // Realtime (useMemberTransactionsRealtime) drives updates; only poll as a
  // safety net while the socket is down, otherwise not at all.
  const connected = useEchoConnected();

  const query = useQuery({
    queryKey: ["member", "transactions"],
    queryFn: async () => (await memberService.transactions({ per_page: PER_PAGE })).data,
    refetchInterval: connected ? false : 30_000,
  });

  const rows: TransactionHistoryRow[] = asArray(query.data?.data).map(toHistoryRow);

  return { rows, query };
}
