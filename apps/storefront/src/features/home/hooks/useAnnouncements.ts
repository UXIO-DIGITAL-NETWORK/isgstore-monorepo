import { useQuery } from "@tanstack/react-query";

import { storefrontService } from "@/services/storefront.service";

/**
 * Operational notices an admin has published — a maintenance window, a
 * schedule change.
 *
 * The API returns the active ones, newest first, and the endpoint carries no
 * category filter, so this is site-wide copy rather than per-game.
 *
 * Returns the query rather than a bare array so the strip can render a skeleton
 * and a retry; `select` keeps `data` as the array callers already expected.
 */
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await storefrontService.announcements()).data,
    select: (data) => data ?? [],
    staleTime: 5 * 60 * 1000,
  });
}
