import type { Article } from "@/features/berita/types/article.type";
import { ALL_ARTICLES } from "@/features/berita/data/articles.data";

const RELATED_COUNT = 3;

export interface UseArticleDetailReturn {
  article: Article | undefined;
  related: Article[];
}

export function useArticleDetail(slug: string): UseArticleDetailReturn {
  const article = ALL_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return { article: undefined, related: [] };
  }

  // Prefer articles from the same category, excluding self
  const sameCategory = ALL_ARTICLES.filter(
    (a) => a.slug !== slug && a.categoryKey === article.categoryKey,
  );

  // Fill to RELATED_COUNT with other articles if same-category is insufficient
  const otherArticles = ALL_ARTICLES.filter(
    (a) => a.slug !== slug && a.categoryKey !== article.categoryKey,
  );

  const related = [...sameCategory, ...otherArticles].slice(0, RELATED_COUNT);

  return { article, related };
}
