import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";

import { useArticleCategoriesQuery, useArticlesQuery } from "@/hooks/useArticlesQuery";
import { toBeritaArticle } from "@/lib/articles";
import { ALL_CATEGORY } from "@/features/berita/types/article.type";
import type { Article, BeritaCategoryKey, CategoryPill } from "@/features/berita/types/article.type";

const PER_PAGE = 9;

export interface UseBeritaReturn {
  pagedArticles: Article[];
  categories: CategoryPill[];
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
  const [activeCategory, setActiveCategoryState] = useState<BeritaCategoryKey>(ALL_CATEGORY);
  const [currentPage, setCurrentPageState] = useState(1);

  const { data: categoryData } = useArticleCategoriesQuery();

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

  /**
   * "Semua" always leads, then whatever the API has. The pills survive a failed
   * or pending categories request — without the leading pill the page would have
   * no usable filter at all, and the articles themselves are unaffected.
   */
  const categories = useMemo<CategoryPill[]>(
    () => [
      { key: ALL_CATEGORY },
      ...(categoryData?.data ?? []).map((category) => ({
        key: category.key,
        label: category.name,
      })),
    ],
    [categoryData],
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
    categories,
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
