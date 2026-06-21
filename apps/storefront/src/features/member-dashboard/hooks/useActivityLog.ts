import { MOCK_ACTIVITY_LOG } from "@/features/member-dashboard/data/activity-log.mock";
import type { ActivityLogRow } from "@/features/member-dashboard/types/activityLog.type";

// TODO: replace with TanStack Query when API is ready
// e.g. useQuery({ queryKey: ["activityLog"], queryFn: () => fetchActivityLog() })
export function useActivityLog(): ActivityLogRow[] {
  return MOCK_ACTIVITY_LOG;
}
