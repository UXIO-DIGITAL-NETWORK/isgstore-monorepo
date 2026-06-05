// Re-export global types so existing feature imports continue to resolve unchanged.
export type { Game as TopUpGame, GameCategory } from "@/types/game.type";

export type CategoryTab = {
  key: import("@/types/game.type").GameCategory;
  label: string;
};
