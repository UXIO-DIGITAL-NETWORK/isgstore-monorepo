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
