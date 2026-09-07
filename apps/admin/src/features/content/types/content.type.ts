/**
 * Content entities, mirroring the API's snake_case rows.
 *
 * Ids are strings because `DataTable` is generic over `{ id: string }` and the
 * services normalise them on read — see `src/lib/apiMappers.ts`.
 */

export type ArticleType = "article" | "news";

/** One `{heading?, paragraphs[]}` block of an article or page body. */
export interface ContentSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleCategory {
  id: string;
  name: string;
  /** Stable slug the storefront filters on — not the display badge. */
  key: string;
  sort_order: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  article_category_id: string;
  /** Overrides the category name on the storefront badge when they differ. */
  category_label?: string;
  type: ArticleType;
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  author_name: string;
  body_sections: ContentSection[];
  image_url?: string;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  view_count: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  meta_robots?: string;
  category?: ArticleCategory;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  group?: string;
  locale: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentPage {
  id: string;
  slug: string;
  locale: string;
  title: string;
  intro: string[];
  sections: ContentSection[];
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_robots?: string;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_title?: string;
  avatar_url?: string;
  content: string;
  rating?: number;
  game_name?: string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleListParams {
  search?: string;
  type?: ArticleType;
  article_category_id?: string;
  locale?: string;
  page?: number;
  per_page?: number;
}

export interface ContentListParams {
  search?: string;
  locale?: string;
  page?: number;
  per_page?: number;
}

export interface Banner {
  id: string;
  category_id?: string;
  name: string;
  image_url?: string;
  link?: string;
  scope: "global" | "targeted";
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  category_id?: string;
  content: string;
  image_url?: string;
  is_active: boolean;
  scope: "global" | "targeted";
  created_at: string;
  updated_at: string;
}
