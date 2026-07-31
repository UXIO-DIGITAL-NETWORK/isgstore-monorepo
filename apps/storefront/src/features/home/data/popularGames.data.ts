import type { PopularGame } from "@/features/home/types/popularGames.type";

/**
 * Editorial badges for the "popular" rail.
 *
 * Purely decorative — there is no trending/best-seller flag in the schema, and
 * inventing one server-side would mean an admin field nobody asked for. The
 * cards alternate through this list by position, which is exactly the rhythm
 * the hand-written list had.
 */
export const POPULAR_BADGES: PopularGame["badge"][] = [
  { emoji: "🔥", label: "TRENDING", labelKey: "popular.badges.trending" },
  { emoji: "⭐", label: "BEST SELLER", labelKey: "popular.badges.bestSeller" },
];
