import { useState } from "react";
import { LEADERBOARD_DATA } from "@/features/leaderboard/data/leaderboard.mock";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/features/leaderboard/types/leaderboard.type";

interface UseLeaderboardReturn {
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  podium: LeaderboardEntry[];
  rest: LeaderboardEntry[];
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const entries = LEADERBOARD_DATA[period];

  return {
    period,
    setPeriod,
    podium: entries.slice(0, 3),
    rest: entries.slice(3),
  };
}
