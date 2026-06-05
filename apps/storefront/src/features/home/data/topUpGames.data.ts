import type { CategoryTab } from "@/features/home/types/topUpGames.type";

// Re-export the canonical game list from the global data module so the
// homepage TopUpGame section keeps working with zero component changes.
export { GAMES as TOP_UP_GAMES } from "@/data/games.data";

export const GAME_CATEGORIES: CategoryTab[] = [
  { key: "semua", label: "Semua" },
  { key: "moba", label: "MOBA" },
  { key: "battle-royale", label: "Battle Royale" },
  { key: "fps", label: "FPS" },
  { key: "pc-games", label: "PC Games" },
  { key: "voucher", label: "Voucher" },
];
