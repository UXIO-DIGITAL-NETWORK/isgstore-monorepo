import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { MarketingListParams, Promo } from "../types/marketing.type";

const BASE = `${API_VERSION}/promos`;

interface PromoApiRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: Promo["type"];
  value: number;
  max_discount: number | null;
  min_purchase: number;
  scope: Promo["scope"];
  scope_id: number | null;
  quota_total: number | null;
  quota_per_user: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const toPromo = (row: PromoApiRow): Promo => ({
  id: toRowId(row.id),
  code: row.code,
  name: row.name,
  description: row.description ?? undefined,
  type: row.type,
  value: row.value,
  max_discount: row.max_discount ?? undefined,
  min_purchase: row.min_purchase,
  scope: row.scope,
  scope_id: row.scope_id !== null ? toRowId(row.scope_id) : undefined,
  quota_total: row.quota_total ?? undefined,
  quota_per_user: row.quota_per_user ?? undefined,
  used_count: row.used_count,
  starts_at: row.starts_at ?? undefined,
  ends_at: row.ends_at ?? undefined,
  is_public: Boolean(row.is_public),
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type PromoInput = Omit<Promo, "id" | "used_count" | "created_at" | "updated_at">;

export const promosService = {
  list: async (params: MarketingListParams = {}): Promise<PaginatedResponse<Promo>> => {
    const response: ApiResponse<PaginatedResponse<PromoApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toPromo);
  },
  getById: async (id: string): Promise<Promo> => {
    const response: ApiResponse<PromoApiRow> = await api.get(`${BASE}/${id}`);
    return toPromo(response.data);
  },
  create: async (input: PromoInput): Promise<Promo> => {
    const response: ApiResponse<PromoApiRow> = await api.post(BASE, input);
    return toPromo(response.data);
  },
  update: async (id: string, input: Partial<PromoInput>): Promise<Promo> => {
    const response: ApiResponse<PromoApiRow> = await api.put(`${BASE}/${id}`, input);
    return toPromo(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
