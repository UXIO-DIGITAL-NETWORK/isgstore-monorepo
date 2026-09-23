import { useQuery } from "@tanstack/react-query";

import { contentService } from "@/services/content.service";

/**
 * Article reads shared by the home and berita features.
 *
 * Lives outside `features/` for the same reason the service does: two features
 * consume it, and neither may import the other.
 */

interface ArticlesQueryParams {
  category?: string;
  type?: "article" | "news";
  search?: string;
  page?: number;
  perPage?: number;
  locale?: string;
}

export const useArticlesQuery = ({ category, type, search, page = 1, perPage = 9, locale }: ArticlesQueryParams) =>
  useQuery({
    queryKey: ["articles", { category, type, search, page, perPage, locale }],
    queryFn: () =>
      contentService.articles({
        // "semua" is the storefront's "all" pill — sending it would filter to
        // a category that does not exist.
        category: category && category !== "semua" ? category : undefined,
        type,
        search: search || undefined,
        page,
        per_page: perPage,
        locale,
      }),
  });

export const useArticleDetailQuery = (slug: string, locale?: string) =>
  useQuery({
    queryKey: ["articles", "detail", slug, locale],
    queryFn: () => contentService.article(slug, locale),
    enabled: Boolean(slug),
  });

/** The homepage's "latest articles" rail. */
export const useLatestArticlesQuery = (limit = 3, locale?: string) =>
  useQuery({
    queryKey: ["articles", "latest", limit, locale],
    queryFn: () => contentService.articles({ per_page: limit, locale }),
  });

/**
 * The category pills on the berita page.
 *
 * Fetched rather than bundled: the list is editorial data, so a category an
 * operator adds in the admin panel has to appear without a front-end deploy —
 * which is exactly what the hardcoded list could not do.
 */
export const useArticleCategoriesQuery = () =>
  useQuery({
    queryKey: ["articles", "categories"],
    queryFn: () => contentService.articleCategories(),
  });
