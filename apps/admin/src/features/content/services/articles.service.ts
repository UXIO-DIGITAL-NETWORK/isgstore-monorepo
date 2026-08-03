import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  Article,
  ArticleCategory,
  ArticleListParams,
  ContentListParams,
  ContentSection,
} from "../types/content.type";

const BASE = `${API_VERSION}/articles`;
const CATEGORIES_BASE = `${API_VERSION}/article-categories`;

interface ArticleCategoryApiRow {
  id: number;
  name: string;
  key: string;
  sort_order: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface ArticleApiRow {
  id: number;
  article_category_id: number;
  category_label: string | null;
  type: Article["type"];
  locale: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string;
  body_sections: ContentSection[] | null;
  image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  meta_robots: string | null;
  category?: ArticleCategoryApiRow | null;
  created_at: string;
  updated_at: string;
}

const toArticleCategory = (row: ArticleCategoryApiRow): ArticleCategory => ({
  id: toRowId(row.id),
  name: row.name,
  key: row.key,
  sort_order: row.sort_order,
  status: Boolean(row.status),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const toArticle = (row: ArticleApiRow): Article => ({
  id: toRowId(row.id),
  article_category_id: toRowId(row.article_category_id),
  category_label: row.category_label ?? undefined,
  type: row.type,
  locale: row.locale,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt ?? undefined,
  author_name: row.author_name,
  body_sections: row.body_sections ?? [],
  image_url: row.image_url ?? undefined,
  is_published: Boolean(row.is_published),
  is_featured: Boolean(row.is_featured),
  published_at: row.published_at ?? undefined,
  view_count: row.view_count ?? 0,
  meta_title: row.meta_title ?? undefined,
  meta_description: row.meta_description ?? undefined,
  meta_keywords: row.meta_keywords ?? [],
  meta_robots: row.meta_robots ?? undefined,
  category: row.category ? toArticleCategory(row.category) : undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type ArticleInput = Omit<
  Article,
  "id" | "slug" | "view_count" | "category" | "created_at" | "updated_at"
> & {
  slug?: string;
  image?: File | null;
};

/**
 * Writes go as multipart so the cover image can ride along, which means the
 * nested arrays have to be JSON-encoded — FormData carries strings only. The
 * API's `prepareForValidation` decodes them back before its rules run.
 *
 * Updates POST with a `_method: PUT` override because PHP does not populate
 * `$_FILES` from a multipart PUT body.
 */
const toFormData = (input: Partial<ArticleInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);

  if (input.article_category_id !== undefined) {
    form.append("article_category_id", String(toFk(input.article_category_id)));
  }
  if (input.category_label !== undefined) form.append("category_label", input.category_label ?? "");
  if (input.type !== undefined) form.append("type", input.type);
  if (input.locale !== undefined) form.append("locale", input.locale);
  if (input.title !== undefined) form.append("title", input.title);
  if (input.slug) form.append("slug", input.slug);
  if (input.excerpt !== undefined) form.append("excerpt", input.excerpt ?? "");
  if (input.author_name !== undefined) form.append("author_name", input.author_name);
  if (input.body_sections !== undefined) form.append("body_sections", JSON.stringify(input.body_sections));
  if (input.is_published !== undefined) form.append("is_published", input.is_published ? "1" : "0");
  if (input.is_featured !== undefined) form.append("is_featured", input.is_featured ? "1" : "0");
  if (input.published_at) form.append("published_at", input.published_at);
  if (input.meta_title !== undefined) form.append("meta_title", input.meta_title ?? "");
  if (input.meta_description !== undefined) form.append("meta_description", input.meta_description ?? "");
  if (input.meta_keywords !== undefined) form.append("meta_keywords", JSON.stringify(input.meta_keywords));
  if (input.meta_robots !== undefined) form.append("meta_robots", input.meta_robots ?? "");
  if (input.image instanceof File) form.append("image_path", input.image);

  return form;
};

export const articlesService = {
  list: async (params: ArticleListParams = {}): Promise<PaginatedResponse<Article>> => {
    const response: ApiResponse<PaginatedResponse<ArticleApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toArticle);
  },

  getById: async (id: string): Promise<Article> => {
    const response: ApiResponse<ArticleApiRow> = await api.get(`${BASE}/${id}`);
    return toArticle(response.data);
  },

  create: async (input: ArticleInput): Promise<Article> => {
    const response: ApiResponse<ArticleApiRow> = await api.post(BASE, toFormData(input));
    return toArticle(response.data);
  },

  update: async (id: string, input: Partial<ArticleInput>): Promise<Article> => {
    const response: ApiResponse<ArticleApiRow> = await api.post(`${BASE}/${id}`, toFormData(input, "PUT"));
    return toArticle(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};

export type ArticleCategoryInput = Omit<ArticleCategory, "id" | "created_at" | "updated_at"> & { key?: string };

export const articleCategoriesService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<ArticleCategory>> => {
    const response: ApiResponse<PaginatedResponse<ArticleCategoryApiRow>> = await api.get(CATEGORIES_BASE, { params });
    return unwrapPaginated(response, toArticleCategory);
  },

  getById: async (id: string): Promise<ArticleCategory> => {
    const response: ApiResponse<ArticleCategoryApiRow> = await api.get(`${CATEGORIES_BASE}/${id}`);
    return toArticleCategory(response.data);
  },

  create: async (input: ArticleCategoryInput): Promise<ArticleCategory> => {
    const response: ApiResponse<ArticleCategoryApiRow> = await api.post(CATEGORIES_BASE, input);
    return toArticleCategory(response.data);
  },

  update: async (id: string, input: Partial<ArticleCategoryInput>): Promise<ArticleCategory> => {
    const response: ApiResponse<ArticleCategoryApiRow> = await api.put(`${CATEGORIES_BASE}/${id}`, input);
    return toArticleCategory(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${CATEGORIES_BASE}/${id}`);
  },
};
