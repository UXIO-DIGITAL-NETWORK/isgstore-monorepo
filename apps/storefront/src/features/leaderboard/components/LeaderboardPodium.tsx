import React from "react";
import { Box } from "@/components/common/Box";
import LeaderboardPodiumCard from "@/features/leaderboard/components/LeaderboardPodiumCard";
import type { LeaderboardEntry } from "@/features/leaderboard/types/leaderboard.type";

interface Props {
  podium: LeaderboardEntry[];
}

export default function LeaderboardPodium({ podium }: Props): React.JSX.Element {
  // podium = [rank1, rank2, rank3]
  const [rank1, rank2, rank3] = podium;

  return (
    <Box className="mt-14 mb-6">
      {/* Desktop: 2nd | 1st | 3rd (center highlighted) */}
      <Box className="hidden md:grid grid-cols-3 gap-4 items-end">
        {rank2 && <LeaderboardPodiumCard entry={rank2} />}
        {rank1 && <LeaderboardPodiumCard entry={rank1} isHighlighted />}
        {rank3 && <LeaderboardPodiumCard entry={rank3} />}
      </Box>

      {/* Mobile: stack as 1st, 2nd, 3rd */}
      <Box className="flex flex-col gap-8 md:hidden">
        {rank1 && <LeaderboardPodiumCard entry={rank1} isHighlighted />}
        {rank2 && <LeaderboardPodiumCard entry={rank2} />}
        {rank3 && <LeaderboardPodiumCard entry={rank3} />}
      </Box>
    </Box>
  );
}
