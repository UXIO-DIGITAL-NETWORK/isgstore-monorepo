import type { LeaderboardEntry, LeaderboardPeriod } from "@/features/leaderboard/types/leaderboard.type";

const todayData: LeaderboardEntry[] = [
  { rank: 1, playerName: "Af P*******a", totalAmount: 1287500 },
  { rank: 2, playerName: "Rn H*******a", totalAmount: 986000 },
  { rank: 3, playerName: "Di K*******h", totalAmount: 872500 },
  { rank: 4, playerName: "Md Ah*******b", totalAmount: 745000 },
  { rank: 5, playerName: "Ya Pi*******d", totalAmount: 638500 },
  { rank: 6, playerName: "Bu S*******g", totalAmount: 612500 },
  { rank: 7, playerName: "Fy N*******e", totalAmount: 521000 },
  { rank: 8, playerName: "Al R*******a", totalAmount: 435500 },
  { rank: 9, playerName: "Pa*******p", totalAmount: 400500 },
  { rank: 10, playerName: "Af P*******e", totalAmount: 368000 },
];

const weekData: LeaderboardEntry[] = [
  { rank: 1, playerName: "Ri S*******o", totalAmount: 5840000 },
  { rank: 2, playerName: "De F*******r", totalAmount: 4520000 },
  { rank: 3, playerName: "An W*******i", totalAmount: 3975000 },
  { rank: 4, playerName: "Bu T*******n", totalAmount: 3210000 },
  { rank: 5, playerName: "Ha L*******a", totalAmount: 2890000 },
  { rank: 6, playerName: "Nu P*******s", totalAmount: 2640000 },
  { rank: 7, playerName: "Fa Z*******k", totalAmount: 2415000 },
  { rank: 8, playerName: "Ir M*******y", totalAmount: 2180000 },
  { rank: 9, playerName: "Su K*******t", totalAmount: 1965000 },
  { rank: 10, playerName: "Ra O*******g", totalAmount: 1720000 },
];

const monthData: LeaderboardEntry[] = [
  { rank: 1, playerName: "Wi B*******u", totalAmount: 24500000 },
  { rank: 2, playerName: "Ag C*******n", totalAmount: 19800000 },
  { rank: 3, playerName: "Li D*******a", totalAmount: 17350000 },
  { rank: 4, playerName: "Mu E*******r", totalAmount: 14900000 },
  { rank: 5, playerName: "Sa F*******i", totalAmount: 13250000 },
  { rank: 6, playerName: "Ek G*******o", totalAmount: 11600000 },
  { rank: 7, playerName: "Na H*******p", totalAmount: 10150000 },
  { rank: 8, playerName: "Jo I*******q", totalAmount: 8900000 },
  { rank: 9, playerName: "Pr J*******r", totalAmount: 7450000 },
  { rank: 10, playerName: "Zi K*******s", totalAmount: 6200000 },
];

export const LEADERBOARD_DATA: Record<LeaderboardPeriod, LeaderboardEntry[]> = {
  today: todayData,
  week: weekData,
  month: monthData,
};
