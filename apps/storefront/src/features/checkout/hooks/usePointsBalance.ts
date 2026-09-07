import { useQuery } from "@tanstack/react-query";

import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import { useAuthStore } from "@/store/useAuthStore";

export interface PointsSummary {
  points: number;
  /** Rupiah one point is worth when redeemed. */
  redeem_rate: number;
  redeem_value: number;
  /** False when the member's plan already buys a discount. */
  allows_point_spending: boolean;
}

/**
 * The member's redeemable points.
 *
 * Guests skip the request entirely — they have no balance, and firing it would
 * only produce a 401 the interceptor has to swallow.
 */
export const usePointsBalance = () => {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["me", "points", userId],
    queryFn: async () => {
      const response: ApiResponse<PointsSummary> = await api.get(`${API_VERSION}/me/points`);
      return response.data;
    },
    enabled: Boolean(userId),
  });
};
