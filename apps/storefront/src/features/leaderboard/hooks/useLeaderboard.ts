import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storefrontService } from "@/services/storefront.service";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/features/leaderboard/types/leaderboard.type";

interface UseLeaderboardReturn {
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  podium: LeaderboardEntry[];
  rest: LeaderboardEntry[];
}

/**
 * Top spenders for the selected window.
 *
 * Names arrive already masked — this page is unauthenticated, so the API never
 * sends a full customer name to it.
 */
export function useLeaderboard(): UseLeaderboardReturn {
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");

  const { data } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const response = await storefrontService.leaderboard(period);
      return response.data.entries.map<LeaderboardEntry>((entry) => ({
        rank: entry.rank,
        playerName: entry.player_name,
        totalAmount: entry.total_amount,
      }));
    },
  });

  const entries = data ?? [];

  return {
    period,
    setPeriod,
    podium: entries.slice(0, 3),
    rest: entries.slice(3),
  };
}
