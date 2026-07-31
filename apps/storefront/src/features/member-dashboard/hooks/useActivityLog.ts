import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/features/member-dashboard/services/member.service";
import { toActivityRow } from "@/features/member-dashboard/lib/mappers";
import type { ActivityLogRow } from "@/features/member-dashboard/types/activityLog.type";

/** One page holds the whole table; the filter bar narrows it client-side. */
const PER_PAGE = 100;

export function useActivityLog(): ActivityLogRow[] {
  const { data } = useQuery({
    queryKey: ["member", "activity-logs"],
    queryFn: async () => (await memberService.activityLogs({ per_page: PER_PAGE })).data,
  });

  return (data?.data ?? []).map(toActivityRow);
}
