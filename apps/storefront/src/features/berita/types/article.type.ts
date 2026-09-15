/**
 * A category key. Data, not a union: the set is editorial and an operator can
 * add one in the admin panel. `"semua"` is reserved for the leading "all" pill,
 * which is the storefront's own and is never a category in the API.
 */
export const ALL_CATEGORY = "semua";

export type BeritaCategoryKey = string;

export interface Article {
  id: string;
  /** URL slug — unique, kebab-case */
  slug: string;
  /** Display label for the category badge (e.g. "MOBILE LEGEND") */
  category: string;
  /** Machine key used for filtering; matches the key the API filters on. */
  categoryKey: string;
  title: string;
  /** Pre-formatted date string, e.g. "01 Mei 2026" */
  date: string;
  /** Author display name */
  author: string;
  image: string;
}

export interface CategoryPill {
  key: BeritaCategoryKey;
  /**
   * The API's own label, used when the key has no translation — a category
   * added in the admin panel has none, and showing its raw key would be worse
   * than showing the name the operator typed.
   */
  label?: string;
}

/** One section of an article body (optional heading + 1+ paragraphs) */
export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}
