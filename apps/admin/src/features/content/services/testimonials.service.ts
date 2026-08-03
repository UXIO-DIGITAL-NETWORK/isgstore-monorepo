import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { ContentListParams, Testimonial } from "../types/content.type";

const BASE = `${API_VERSION}/testimonials`;

interface TestimonialApiRow {
  id: number;
  author_name: string;
  author_title: string | null;
  avatar_url: string | null;
  content: string;
  rating: number | null;
  game_name: string | null;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const toTestimonial = (row: TestimonialApiRow): Testimonial => ({
  id: toRowId(row.id),
  author_name: row.author_name,
  author_title: row.author_title ?? undefined,
  avatar_url: row.avatar_url ?? undefined,
  content: row.content,
  rating: row.rating ?? undefined,
  game_name: row.game_name ?? undefined,
  is_featured: Boolean(row.is_featured),
  sort_order: row.sort_order,
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type TestimonialInput = Omit<Testimonial, "id" | "avatar_url" | "created_at" | "updated_at"> & {
  avatar?: File | null;
};

/** Multipart because of the avatar upload; PUT is spoofed for the same reason
 * as every other file-carrying update in this repo. */
const toFormData = (input: Partial<TestimonialInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);

  if (input.author_name !== undefined) form.append("author_name", input.author_name);
  if (input.author_title !== undefined) form.append("author_title", input.author_title ?? "");
  if (input.content !== undefined) form.append("content", input.content);
  if (input.rating !== undefined && input.rating !== null) form.append("rating", String(input.rating));
  if (input.game_name !== undefined) form.append("game_name", input.game_name ?? "");
  if (input.is_featured !== undefined) form.append("is_featured", input.is_featured ? "1" : "0");
  if (input.sort_order !== undefined) form.append("sort_order", String(input.sort_order));
  if (input.is_active !== undefined) form.append("is_active", input.is_active ? "1" : "0");
  if (input.avatar instanceof File) form.append("avatar_path", input.avatar);

  return form;
};

export const testimonialsService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<Testimonial>> => {
    const response: ApiResponse<PaginatedResponse<TestimonialApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toTestimonial);
  },

  getById: async (id: string): Promise<Testimonial> => {
    const response: ApiResponse<TestimonialApiRow> = await api.get(`${BASE}/${id}`);
    return toTestimonial(response.data);
  },

  create: async (input: TestimonialInput): Promise<Testimonial> => {
    const response: ApiResponse<TestimonialApiRow> = await api.post(BASE, toFormData(input));
    return toTestimonial(response.data);
  },

  update: async (id: string, input: Partial<TestimonialInput>): Promise<Testimonial> => {
    const response: ApiResponse<TestimonialApiRow> = await api.post(`${BASE}/${id}`, toFormData(input, "PUT"));
    return toTestimonial(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
