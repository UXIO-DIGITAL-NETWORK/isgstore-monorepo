import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import LeaderboardHero from "@/features/leaderboard/components/LeaderboardHero";
import LeaderboardPeriodTabs from "@/features/leaderboard/components/LeaderboardPeriodTabs";
import LeaderboardPodium from "@/features/leaderboard/components/LeaderboardPodium";
import LeaderboardTable from "@/features/leaderboard/components/LeaderboardTable";
import { useLeaderboard } from "@/features/leaderboard/hooks/useLeaderboard";

function LeaderboardSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="flex flex-col gap-5">
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </Box>
      <Box className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-xl" />
        ))}
      </Box>
    </Box>
  );
}

export default function LeaderboardPage(): React.JSX.Element {
  const { t } = useTranslation("leaderboard");
  const { period, setPeriod, podium, rest, query } = useLeaderboard();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        <LeaderboardHero />

        <LeaderboardPeriodTabs period={period} onPeriodChange={setPeriod} />

        <QueryState
          query={query}
          skeleton={<LeaderboardSkeleton />}
          isEmpty={(entries) => entries.length === 0}
          empty={
            <EmptyState
              title={t("empty.title")}
              description={t("empty.description")}
            />
          }
        >
          {() => (
            <>
              <LeaderboardPodium podium={podium} />

              <LeaderboardTable rows={rest} />
            </>
          )}
        </QueryState>
      </Box>

      <Footer />
    </Box>
  );
}
