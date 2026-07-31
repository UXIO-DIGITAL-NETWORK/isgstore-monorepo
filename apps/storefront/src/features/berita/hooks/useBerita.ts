import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";

import { useArticlesQuery } from "@/hooks/useArticlesQuery";
import { toBeritaArticle } from "@/lib/articles";
import type { Article, BeritaCategoryKey } from "@/features/berita/types/article.type";

const PER_PAGE = 9;

export interface UseBeritaReturn {
  pagedArticles: Article[];
  activeCategory: BeritaCategoryKey;
  setActiveCategory: (category: BeritaCategoryKey) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  totalResults: number;
}

/**
 * Filtering and pagination moved server-side — the page no longer downloads
 * every article in order to show nine. The return interface is unchanged, so
 * `BeritaPage` and `BeritaPagination` render exactly as before.
 */
export function useBerita(): UseBeritaReturn {
  const { locale } = useParams({ strict: false }) as { locale?: string };
  const [activeCategory, setActiveCategoryState] = useState<BeritaCategoryKey>("semua");
  const [currentPage, setCurrentPageState] = useState(1);

  const { data } = useArticlesQuery({
    category: activeCategory,
    page: currentPage,
    perPage: PER_PAGE,
    locale,
  });

  const pagedArticles = useMemo<Article[]>(
    () => (data?.data.data ?? []).map((model) => toBeritaArticle(model, locale ?? "id")),
    [data, locale],
  );

  const totalResults = data?.data.meta.total ?? 0;
  const totalPages = Math.max(1, data?.data.meta.last_page ?? 1);

  function setActiveCategory(category: BeritaCategoryKey) {
    setActiveCategoryState(category);
    setCurrentPageState(1);
  }

  function setCurrentPage(page: number) {
    setCurrentPageState(page);
  }

  return {
    pagedArticles,
    activeCategory,
    setActiveCategory,
    // Clamped so a category switch that shrinks the result set cannot leave
    // the pager pointing past the last page.
    currentPage: Math.min(currentPage, totalPages),
    setCurrentPage,
    totalPages,
    totalResults,
  };
}
