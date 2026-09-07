import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import LeaderboardHero from "@/features/leaderboard/components/LeaderboardHero";
import LeaderboardPeriodTabs from "@/features/leaderboard/components/LeaderboardPeriodTabs";
import LeaderboardPodium from "@/features/leaderboard/components/LeaderboardPodium";
import LeaderboardTable from "@/features/leaderboard/components/LeaderboardTable";
import { useLeaderboard } from "@/features/leaderboard/hooks/useLeaderboard";

export default function LeaderboardPage(): React.JSX.Element {
  const { period, setPeriod, podium, rest } = useLeaderboard();

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        <LeaderboardHero />

        <LeaderboardPeriodTabs period={period} onPeriodChange={setPeriod} />

        <LeaderboardPodium podium={podium} />

        <LeaderboardTable rows={rest} />
      </Box>

      <Footer />
    </Box>
  );
}
