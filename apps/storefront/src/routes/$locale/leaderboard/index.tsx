import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardPage } from "@/features/leaderboard";

export const Route = createFileRoute("/$locale/leaderboard/")({
  component: LeaderboardPage,
});
