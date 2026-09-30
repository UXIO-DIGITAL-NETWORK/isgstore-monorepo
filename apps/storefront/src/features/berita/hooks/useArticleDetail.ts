import { useMemo } from "react";
import { useParams } from "@tanstack/react-router";

import { useArticleDetailQuery } from "@/hooks/useArticlesQuery";
import { toBeritaArticle } from "@/lib/articles";
import type { Article, ArticleSection } from "@/features/berita/types/article.type";

export interface UseArticleDetailReturn {
  article: Article | undefined;
  related: Article[];
  /** This article's own body, replacing the shared placeholder constant. */
  sections: ArticleSection[];
  isLoading: boolean;
  /** The raw query, for the page's loading / error / not-found states. */
  query: ReturnType<typeof useArticleDetailQuery>;
}

/**
 * Related articles are resolved by the API rather than computed here — finding
 * three neighbours by downloading the whole archive would not scale past a
 * page of results.
 */
export function useArticleDetail(slug: string): UseArticleDetailReturn {
  const { locale } = useParams({ strict: false }) as { locale?: string };
  const query = useArticleDetailQuery(slug, locale);
  const { data, isLoading } = query;

  const detail = data?.data;

  const article = useMemo(
    () => (detail ? toBeritaArticle(detail.article, locale ?? "id") : undefined),
    [detail, locale],
  );

  const related = useMemo(
    () => (detail?.related ?? []).map((model) => toBeritaArticle(model, locale ?? "id")),
    [detail, locale],
  );

  return {
    article,
    related,
    sections: detail?.article.body_sections ?? [],
    isLoading,
    query,
  };
}
