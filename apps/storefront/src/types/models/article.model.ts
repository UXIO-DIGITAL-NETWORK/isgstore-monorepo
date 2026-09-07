/** One row of `GET /v1/storefront/articles`. */
export interface ArticleModel {
  id: number;
  slug: string;
  type: "article" | "news";
  title: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  published_at: string | null;
  is_featured: boolean;
  category: {
    /** Stable filter key — matches the storefront's category pills. */
    key: string | null;
    /** Display badge, which can legitimately differ from the pill's label. */
    name: string | null;
  };
}

/** One `{heading?, paragraphs[]}` block of an article body. */
export interface ArticleSectionModel {
  heading?: string;
  paragraphs: string[];
}

export interface ArticleDetailModel extends ArticleModel {
  body_sections: ArticleSectionModel[];
  meta: {
    title: string | null;
    description: string | null;
    keywords: string[];
    robots: string | null;
  };
}

/** `GET /v1/storefront/articles/{slug}` resolves related articles server-side. */
export interface ArticleDetailResponse {
  article: ArticleDetailModel;
  related: ArticleModel[];
}

export interface ArticleCategoryModel {
  id: number;
  name: string;
  key: string;
  sort_order: number;
  status: boolean;
}

/** One row of `GET /v1/storefront/faqs`. */
export interface FaqModel {
  id: number;
  question: string;
  answer: string;
  group: string | null;
}

/** `GET /v1/storefront/pages/{slug}`. */
export interface PageModel {
  slug: string;
  title: string;
  intro: string[];
  sections: { heading?: string; paragraphs: string[]; bullets?: string[] }[];
  meta: { title: string | null; description: string | null; robots: string | null };
  updated_at: string;
}
