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
  /** URL slug — unique, kebab-case */
  slug: string;
  /** Display label for the category badge (e.g. "MOBILE LEGEND") */
  category: string;
  /** Machine key used for filtering (matches BeritaCategoryKey, excluding "semua") */
  categoryKey: Exclude<BeritaCategoryKey, "semua">;
  title: string;
  /** Pre-formatted date string, e.g. "01 Mei 2026" */
  date: string;
  /** Author display name */
  author: string;
  image: string;
}

export interface CategoryPill {
  key: BeritaCategoryKey;
}

/** One section of an article body (optional heading + 1+ paragraphs) */
export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}
