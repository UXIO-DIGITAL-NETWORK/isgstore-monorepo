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
  logoImage: string;
  category: Exclude<GameCategory, "semua">;
  borderColor: "azure" | "violet";
};
