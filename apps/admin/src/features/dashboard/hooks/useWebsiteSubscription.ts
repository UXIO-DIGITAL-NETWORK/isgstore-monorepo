import { useQuery } from "@tanstack/react-query";

import { websiteSubscriptionService } from "../services/websiteSubscription.service";

/**
 * Fetched once and cached for five minutes: an expiry date measured in days is
 * not real-time data, and this rides along with every page load.
 */
export const useWebsiteSubscription = () =>
  useQuery({
    queryKey: ["website-subscription"],
    queryFn: websiteSubscriptionService.get,
    staleTime: 5 * 60_000,
  });
