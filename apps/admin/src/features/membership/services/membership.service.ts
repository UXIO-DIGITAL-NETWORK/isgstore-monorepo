import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { MembershipListParams, MembershipTier } from "../types/membership.type";

const BASE = `${API_VERSION}/membership-tiers`;

interface MembershipTierApiRow {
  id: number;
  name: string;
  min_spend: number;
  discount_percent: number;
  benefits: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const toTier = (row: MembershipTierApiRow): MembershipTier => ({
  id: toRowId(row.id),
  name: row.name,
  min_spend: row.min_spend,
  discount_percent: row.discount_percent,
  benefits: row.benefits ?? undefined,
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const membershipService = {
  list: async (params: MembershipListParams = {}): Promise<PaginatedResponse<MembershipTier>> => {
    const response: ApiResponse<PaginatedResponse<MembershipTierApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toTier);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
