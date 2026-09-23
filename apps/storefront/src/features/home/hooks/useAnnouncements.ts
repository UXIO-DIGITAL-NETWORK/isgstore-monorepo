import { useQuery } from "@tanstack/react-query";

import { storefrontService, type AnnouncementModel } from "@/services/storefront.service";

/**
 * Operational notices an admin has published — a maintenance window, a
 * schedule change.
 *
 * The API returns the active ones, newest first, and the endpoint carries no
 * category filter, so this is site-wide copy rather than per-game.
 */
export function useAnnouncements(): AnnouncementModel[] {
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await storefrontService.announcements();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return data ?? [];
}
