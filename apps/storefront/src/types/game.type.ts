export type GameCategory =
  | "semua"
  | "moba"
  | "battle-royale"
  | "fps"
  | "pc-games"
  | "voucher";

export type Game = {
  id: string;
  title: string;
  region: string;
  bgImage: string;
  /** Small logo overlaid on the card; null when the category has no logo. */
  logoImage: string | null;
  category: Exclude<GameCategory, "semua">;
  borderColor: "green" | "gold";
};
