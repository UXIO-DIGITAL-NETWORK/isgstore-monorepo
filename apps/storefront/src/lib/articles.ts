import { formatDate } from "@/lib/format";
import type { ArticleModel } from "@/types/models/article.model";
import type { Article as BeritaArticle } from "@/features/berita/types/article.type";
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
  // Passed through as-is: the pills are the API's own category list, so folding
  // an unrecognised key into a catch-all would file an operator's new category
  // under "Lainnya" and hide it behind a pill that does not match.
  categoryKey: model.category.key ?? "lainnya",
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
