import { useMemo, useState } from "react";
import type { Article, BeritaCategoryKey } from "@/features/berita/types/article.type";
import { ALL_ARTICLES } from "@/features/berita/data/articles.data";

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

export function useBerita(): UseBeritaReturn {
  const [activeCategory, setActiveCategoryState] = useState<BeritaCategoryKey>("semua");
  const [currentPage, setCurrentPageState] = useState(1);

  const filtered = useMemo<Article[]>(() => {
    if (activeCategory === "semua") return ALL_ARTICLES;
    return ALL_ARTICLES.filter((a) => a.categoryKey === activeCategory);
  }, [activeCategory]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PER_PAGE));

  // Clamp currentPage in case filtered results shrank under a previous page
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedArticles = useMemo<Article[]>(() => {
    const start = (safeCurrentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, safeCurrentPage]);

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
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    totalResults,
  };
}
