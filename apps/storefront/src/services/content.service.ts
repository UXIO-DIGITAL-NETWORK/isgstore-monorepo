import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  ArticleCategoryModel,
  ArticleDetailResponse,
  ArticleModel,
  FaqModel,
  PageModel,
} from "@/types/models/article.model";

/**
 * CMS reads. Articles are consumed by both the home and berita features, so
 * this lives outside `features/` — the golden rule forbids one feature
 * importing another, and the shared service is how they both reach the same
 * endpoint.
 */
export const contentService = {
  articles: async (params: {
    category?: string;
    type?: "article" | "news";
    search?: string;
    featured?: boolean;
    page?: number;
    per_page?: number;
    locale?: string;
  }): Promise<PaginatedResponse<ArticleModel>> => {
    return await api.get(`${API_VERSION}/storefront/articles`, { params });
  },

  article: async (slug: string, locale?: string): Promise<ApiResponse<ArticleDetailResponse>> => {
    return await api.get(`${API_VERSION}/storefront/articles/${slug}`, { params: { locale } });
  },

  articleCategories: async (): Promise<ApiResponse<ArticleCategoryModel[]>> => {
    return await api.get(`${API_VERSION}/storefront/article-categories`);
  },

  faqs: async (locale: string): Promise<ApiResponse<FaqModel[]>> => {
    return await api.get(`${API_VERSION}/storefront/faqs`, { params: { locale } });
  },

  page: async (slug: string, locale: string): Promise<ApiResponse<PageModel>> => {
    return await api.get(`${API_VERSION}/storefront/pages/${slug}`, { params: { locale } });
  },
};
