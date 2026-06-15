export type LeaderboardPeriod = "today" | "week" | "month";

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  totalAmount: number;
}
