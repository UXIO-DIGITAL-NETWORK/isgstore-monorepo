import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { ContentListParams, ContentPage, ContentSection } from "../types/content.type";

const BASE = `${API_VERSION}/pages`;

interface PageApiRow {
  id: number;
  slug: string;
  locale: string;
  title: string;
  intro: string[] | null;
  sections: ContentSection[] | null;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_robots: string | null;
  created_at: string;
  updated_at: string;
}

const toPage = (row: PageApiRow): ContentPage => ({
  id: toRowId(row.id),
  slug: row.slug,
  locale: row.locale,
  title: row.title,
  intro: row.intro ?? [],
  sections: row.sections ?? [],
  is_published: Boolean(row.is_published),
  meta_title: row.meta_title ?? undefined,
  meta_description: row.meta_description ?? undefined,
  meta_robots: row.meta_robots ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type ContentPageInput = Omit<ContentPage, "id" | "created_at" | "updated_at">;

export const pagesService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<ContentPage>> => {
    const response: ApiResponse<PaginatedResponse<PageApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toPage);
  },

  getById: async (id: string): Promise<ContentPage> => {
    const response: ApiResponse<PageApiRow> = await api.get(`${BASE}/${id}`);
    return toPage(response.data);
  },

  create: async (input: ContentPageInput): Promise<ContentPage> => {
    const response: ApiResponse<PageApiRow> = await api.post(BASE, input);
    return toPage(response.data);
  },

  update: async (id: string, input: Partial<ContentPageInput>): Promise<ContentPage> => {
    const response: ApiResponse<PageApiRow> = await api.put(`${BASE}/${id}`, input);
    return toPage(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
