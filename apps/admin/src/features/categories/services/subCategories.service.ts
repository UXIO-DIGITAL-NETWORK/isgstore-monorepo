import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { fromStatusUnion, toFk, toRowId, toStatusUnion, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { SubCategory, SubCategoryListParams } from "../types/subCategory.type";

const BASE = `${API_VERSION}/sub-categories`;

interface SubCategoryApiRow {
  id: number;
  category_id: number;
  name: string;
  currency_name: string | null;
  description: string | null;
  logo: string | null;
  logo_url: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const toSubCategory = (row: SubCategoryApiRow): SubCategory => ({
  id: toRowId(row.id),
  category_id: toRowId(row.category_id),
  name: row.name,
  currency_name: row.currency_name ?? "",
  description: row.description ?? undefined,
  logo_url: row.logo_url ?? undefined,
  status: toStatusUnion(row.status),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type SubCategoryInput = Omit<SubCategory, "id" | "created_at" | "updated_at"> & { logo?: File | null };

/**
 * The logo is a real file upload, so writes go as multipart rather than JSON.
 * PHP does not populate `$_POST`/`$_FILES` from a multipart body on PUT, so
 * updates POST with a `_method: PUT` override — the same spoof the storefront
 * uses for its profile-with-avatar update.
 */
const toFormData = (input: Partial<SubCategoryInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);
  if (input.category_id !== undefined) form.append("category_id", String(toFk(input.category_id)));
  if (input.name !== undefined) form.append("name", input.name);
  if (input.currency_name !== undefined) form.append("currency_name", input.currency_name);
  if (input.description !== undefined) form.append("description", input.description ?? "");
  if (input.status !== undefined) form.append("status", fromStatusUnion(input.status) ? "1" : "0");
  if (input.logo instanceof File) form.append("logo", input.logo);
  return form;
};

export const subCategoriesService = {
  list: async (params: SubCategoryListParams = {}): Promise<PaginatedResponse<SubCategory>> => {
    const response: ApiResponse<PaginatedResponse<SubCategoryApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toSubCategory);
  },

  getById: async (id: string): Promise<SubCategory> => {
    const response: ApiResponse<SubCategoryApiRow> = await api.get(`${BASE}/${id}`);
    return toSubCategory(response.data);
  },

  create: async (input: SubCategoryInput): Promise<SubCategory> => {
    const response: ApiResponse<SubCategoryApiRow> = await api.post(BASE, toFormData(input));
    return toSubCategory(response.data);
  },

  update: async (id: string, input: Partial<SubCategoryInput>): Promise<SubCategory> => {
    const response: ApiResponse<SubCategoryApiRow> = await api.post(`${BASE}/${id}`, toFormData(input, "PUT"));
    return toSubCategory(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
