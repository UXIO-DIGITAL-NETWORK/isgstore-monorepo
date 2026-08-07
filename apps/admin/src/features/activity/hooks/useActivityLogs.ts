import { useQuery } from "@tanstack/react-query";

import { activityService } from "../services/activity.service";
import type { ActivityListParams } from "../types/activity.type";

/** Paginated admin-wide activity feed; re-fetches whenever search/page change. */
export const useActivityLogs = (params: ActivityListParams) =>
  useQuery({
    queryKey: ["activity-logs", "list", params],
    queryFn: () => activityService.list(params),
  });
