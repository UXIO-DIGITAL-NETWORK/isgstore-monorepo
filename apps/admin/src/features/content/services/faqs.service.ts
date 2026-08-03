import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { ContentListParams, Faq } from "../types/content.type";

const BASE = `${API_VERSION}/faqs`;

interface FaqApiRow {
  id: number;
  question: string;
  answer: string;
  group: string | null;
  locale: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const toFaq = (row: FaqApiRow): Faq => ({
  id: toRowId(row.id),
  question: row.question,
  answer: row.answer,
  group: row.group ?? undefined,
  locale: row.locale,
  sort_order: row.sort_order,
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type FaqInput = Omit<Faq, "id" | "created_at" | "updated_at">;

export const faqsService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<Faq>> => {
    const response: ApiResponse<PaginatedResponse<FaqApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toFaq);
  },

  getById: async (id: string): Promise<Faq> => {
    const response: ApiResponse<FaqApiRow> = await api.get(`${BASE}/${id}`);
    return toFaq(response.data);
  },

  create: async (input: FaqInput): Promise<Faq> => {
    const response: ApiResponse<FaqApiRow> = await api.post(BASE, input);
    return toFaq(response.data);
  },

  update: async (id: string, input: Partial<FaqInput>): Promise<Faq> => {
    const response: ApiResponse<FaqApiRow> = await api.put(`${BASE}/${id}`, input);
    return toFaq(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
