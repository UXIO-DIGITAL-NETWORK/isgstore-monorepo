import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { asArray, toActivityRow } from "@/features/member-dashboard/lib/mappers";
import type { ActivityLogRow } from "@/features/member-dashboard/types/activityLog.type";

/** One page holds the whole table; the filter bar narrows it client-side. */
const PER_PAGE = 100;

/**
 * The member's activity log.
 *
 * Returns the query alongside the mapped rows so the page can show a table
 * skeleton / error / empty state rather than a silently blank table.
 */
export function useActivityLog() {
  const query = useQuery({
    queryKey: ["member", "activity-logs"],
    queryFn: async () => (await memberService.activityLogs({ per_page: PER_PAGE })).data,
  });

  const rows: ActivityLogRow[] = asArray(query.data?.data).map(toActivityRow);

  return { rows, query };
}
