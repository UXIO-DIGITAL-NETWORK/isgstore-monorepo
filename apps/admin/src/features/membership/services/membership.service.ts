import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { MembershipListParams, MembershipPlan, MembershipPlanInput } from "../types/membership.type";

const BASE = `${API_VERSION}/membership-plans`;

interface MembershipPlanApiRow {
  id: number;
  code: string;
  name: string;
  benefits: string[] | null;
  price: number;
  duration_days: number;
  role_id: number | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const toPlan = (row: MembershipPlanApiRow): MembershipPlan => ({
  id: toRowId(row.id),
  code: row.code,
  name: row.name,
  benefits: row.benefits ?? [],
  price: row.price,
  duration_days: row.duration_days,
  role_id: row.role_id,
  is_popular: Boolean(row.is_popular),
  is_active: Boolean(row.is_active),
  sort_order: row.sort_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const membershipService = {
  list: async (params: MembershipListParams = {}): Promise<PaginatedResponse<MembershipPlan>> => {
    const response: ApiResponse<PaginatedResponse<MembershipPlanApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toPlan);
  },
  create: async (input: MembershipPlanInput): Promise<MembershipPlan> => {
    const response: ApiResponse<MembershipPlanApiRow> = await api.post(BASE, input);
    return toPlan(response.data);
  },
  update: async (id: string, input: Partial<MembershipPlanInput>): Promise<MembershipPlan> => {
    const response: ApiResponse<MembershipPlanApiRow> = await api.put(`${BASE}/${id}`, input);
    return toPlan(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
