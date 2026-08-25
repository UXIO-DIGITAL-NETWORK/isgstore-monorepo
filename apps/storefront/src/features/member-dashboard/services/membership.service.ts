import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** One row of `GET /v1/storefront/membership-plans`. */
export interface MembershipPlanModel {
  id: number;
  code: string;
  name: string;
  benefits: string[];
  price: number;
  /** `null` = lifetime; the API stopped coercing it to 0. */
  duration_days: number | null;
  is_popular: boolean;
}

export interface CurrentMembershipModel {
  plan_code: string;
  plan_name: string;
  starts_at: string;
  ends_at: string;
}

export const membershipService = {
  /**
   * Plan copy is stored per locale on the API rather than as i18n keys — a
   * plan is a purchasable entity an admin edits, so its wording lives with the
   * record, not in the client bundle.
   */
  plans: async (locale: string): Promise<ApiResponse<MembershipPlanModel[]>> =>
    await api.get(`${API_VERSION}/storefront/membership-plans`, { params: { locale } }),

  current: async (locale: string): Promise<ApiResponse<CurrentMembershipModel | null>> =>
    await api.get(`${API_VERSION}/me/membership`, { params: { locale } }),

  subscribe: async (membershipPlanId: number): Promise<ApiResponse<{ ends_at: string }>> =>
    await api.post(`${API_VERSION}/me/membership/subscribe`, { membership_plan_id: membershipPlanId }),
};
