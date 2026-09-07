import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { CategoryProvider, CategoryProviderListParams } from "../types/categoryProvider.type";

/**
 * "Category Provider" is this feature's user-facing name for what the API
 * calls a **supplier category** — the mapping of which upstream supplier
 * fulfils which category, and which of that supplier's own categories its SKUs
 * come from. Only the URL and field names differ; the entity is the same. The translation is confined
 * to this file so neither side has to be renamed.
 */
const BASE = `${API_VERSION}/supplier-categories`;

interface SupplierCategoryApiRow {
  id: number;
  category_id: number;
  supplier_id: number;
  provider_category: string;
  supplier?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

const toCategoryProvider = (row: SupplierCategoryApiRow): CategoryProvider => ({
  id: toRowId(row.id),
  // The list renders the supplier's name; fall back to the id so a row with an
  // un-eager-loaded relation still identifies itself rather than rendering blank.
  provider_name: row.supplier?.name ?? String(row.supplier_id),
  supplier_id: toRowId(row.supplier_id),
  category_id: toRowId(row.category_id),
  provider_category: row.provider_category,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type CategoryProviderInput = Omit<CategoryProvider, "id" | "created_at" | "updated_at" | "provider_name"> & {
  /** Display-only on reads; never submitted. */
  provider_name?: string;
};

const toPayload = (input: Partial<CategoryProviderInput>) => ({
  ...(input.category_id !== undefined && { category_id: toFk(input.category_id) }),
  ...(input.supplier_id !== undefined && { supplier_id: toFk(input.supplier_id) }),
  ...(input.provider_category !== undefined && { provider_category: input.provider_category }),
});

export const categoryProvidersService = {
  list: async (params: CategoryProviderListParams = {}): Promise<PaginatedResponse<CategoryProvider>> => {
    // `supplier_id` is passed straight through: the API filters on it exactly.
    // It used to be the provider's name folded into `search`, which also
    // matched provider_category and the category name — so choosing a provider
    // silently widened the results instead of narrowing them.
    const response: ApiResponse<PaginatedResponse<SupplierCategoryApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toCategoryProvider);
  },

  getById: async (id: string): Promise<CategoryProvider> => {
    const response: ApiResponse<SupplierCategoryApiRow> = await api.get(`${BASE}/${id}`);
    return toCategoryProvider(response.data);
  },

  create: async (input: CategoryProviderInput): Promise<CategoryProvider> => {
    const response: ApiResponse<SupplierCategoryApiRow> = await api.post(BASE, toPayload(input));
    return toCategoryProvider(response.data);
  },

  update: async (id: string, input: Partial<CategoryProviderInput>): Promise<CategoryProvider> => {
    const response: ApiResponse<SupplierCategoryApiRow> = await api.put(`${BASE}/${id}`, toPayload(input));
    return toCategoryProvider(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
