import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { fromStatusUnion, toRowId, toStatusUnion, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { CategoryStatus } from "../types/category.type";
import type { CategoryType, CategoryTypeListParams } from "../types/categoryType.type";

const BASE = `${API_VERSION}/category-types`;

/** The API row, before mapping onto this feature's `CategoryType`. */
interface CategoryTypeApiRow {
  id: number;
  name: string;
  is_voucher: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const toCategoryType = (row: CategoryTypeApiRow): CategoryType => ({
  id: toRowId(row.id),
  name: row.name,
  is_voucher: Boolean(row.is_voucher),
  status: toStatusUnion(row.status),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

type CategoryTypeInput = Omit<CategoryType, "id" | "created_at" | "updated_at">;

const toPayload = (input: Partial<CategoryTypeInput>) => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.is_voucher !== undefined && { is_voucher: input.is_voucher }),
  ...(input.status !== undefined && { status: fromStatusUnion(input.status) }),
});

export const categoryTypesService = {
  list: async (params: CategoryTypeListParams = {}): Promise<PaginatedResponse<CategoryType>> => {
    const response: ApiResponse<PaginatedResponse<CategoryTypeApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toCategoryType);
  },

  getById: async (id: string): Promise<CategoryType> => {
    const response: ApiResponse<CategoryTypeApiRow> = await api.get(`${BASE}/${id}`);
    return toCategoryType(response.data);
  },

  create: async (input: CategoryTypeInput): Promise<CategoryType> => {
    const response: ApiResponse<CategoryTypeApiRow> = await api.post(BASE, toPayload(input));
    return toCategoryType(response.data);
  },

  update: async (id: string, input: Partial<CategoryTypeInput>): Promise<CategoryType> => {
    const response: ApiResponse<CategoryTypeApiRow> = await api.put(`${BASE}/${id}`, toPayload(input));
    return toCategoryType(response.data);
  },

  /**
   * The API has no dedicated status endpoint, and `PUT /category-types/{id}`
   * validates `name` as required — a status-only write would 422. Reading the
   * row first keeps the row-menu toggle a single call site rather than pushing
   * that detail into the component.
   */
  setStatus: async (id: string, status: CategoryStatus): Promise<CategoryType> => {
    const current = await categoryTypesService.getById(id);
    return categoryTypesService.update(id, { name: current.name, is_voucher: current.is_voucher, status });
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
