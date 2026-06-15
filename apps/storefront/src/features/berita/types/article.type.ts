export type BeritaCategoryKey =
  | "semua"
  | "promo"
  | "mobile-legend"
  | "free-fire"
  | "honor-of-kings"
  | "valorant"
  | "lainnya";

export interface Article {
  id: string;
  /** Display label for the category badge (e.g. "MOBILE LEGEND") */
  category: string;
  /** Machine key used for filtering (matches BeritaCategoryKey, excluding "semua") */
  categoryKey: Exclude<BeritaCategoryKey, "semua">;
  title: string;
  /** Pre-formatted date string, e.g. "01 Mei 2026" */
  date: string;
  image: string;
}

export interface CategoryPill {
  key: BeritaCategoryKey;
}
