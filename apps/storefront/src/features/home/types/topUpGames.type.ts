export type GameCategory =
  | "semua"
  | "moba"
  | "battle-royale"
  | "fps"
  | "pc-games"
  | "voucher";

export type TopUpGame = {
  id: string;
  title: string;
  region: string;
  bgImage: string;
  logoImage: string;
  category: Exclude<GameCategory, "semua">;
  borderColor: "azure" | "violet";
};

export type CategoryTab = {
  key: GameCategory;
  label: string;
};
