import { formatDate } from "@/lib/format";
import type { ArticleModel } from "@/types/models/article.model";
import type { Article as BeritaArticle, BeritaCategoryKey } from "@/features/berita/types/article.type";
import type { Article as HomeArticle } from "@/features/home/types/artikel.type";

/**
 * Mappers from the shared API model onto the two view types that consume it.
 *
 * The home and berita features each declare their own `Article` shape and must
 * not import from one another, so both mappers live here — a `lib` file may
 * import a feature's *type* (types flow up), while the reverse would break the
 * isolation rule.
 */

/**
 * The storefront's category pills are a closed set with their own translated
 * labels, so an unrecognised key is folded into the catch-all rather than
 * rendering a pill that does not exist.
 */
const KNOWN_KEYS: readonly BeritaCategoryKey[] = [
  "promo",
  "mobile-legend",
  "free-fire",
  "honor-of-kings",
  "valorant",
  "lainnya",
];

export const coerceCategoryKey = (key: string | null | undefined): Exclude<BeritaCategoryKey, "semua"> => {
  const match = KNOWN_KEYS.find((known) => known === key);
  return (match ?? "lainnya") as Exclude<BeritaCategoryKey, "semua">;
};

/**
 * The badge is whatever the API sends as the category name — which may
 * deliberately differ from the pill the article files under (a PUBG article
 * sits in "Lainnya" but badges as PUBG MOBILE). The card uppercases it in CSS.
 */
const badge = (model: ArticleModel): string => model.category.name ?? "";

/** `date` is a pre-formatted display string on both view types, not an ISO stamp. */
const displayDate = (model: ArticleModel, locale: string): string =>
  model.published_at ? formatDate(model.published_at, locale) : "";

export const toBeritaArticle = (model: ArticleModel, locale: string): BeritaArticle => ({
  id: String(model.id),
  slug: model.slug,
  category: badge(model),
  categoryKey: coerceCategoryKey(model.category.key),
  title: model.title,
  date: displayDate(model, locale),
  author: model.author,
  image: model.image_url ?? "",
});

export const toHomeArticle = (model: ArticleModel, locale: string): HomeArticle => ({
  id: String(model.id),
  slug: model.slug,
  category: badge(model),
  title: model.title,
  date: displayDate(model, locale),
  image: model.image_url ?? "",
});
