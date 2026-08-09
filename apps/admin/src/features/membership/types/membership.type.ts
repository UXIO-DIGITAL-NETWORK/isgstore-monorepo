/** Membership plans (loyalty tiers) — backed by the API's `membership_plans`. */

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  benefits: string[];
  /** Plan price in IDR. */
  price: number;
  /** How long the plan lasts once subscribed. */
  duration_days: number;
  role_id: number | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** Write payload — `name`/`benefits` are single-locale here; the API folds them into its JSON columns. */
export interface MembershipPlanInput {
  code: string;
  name: string;
  benefits?: string[];
  price: number;
  duration_days: number;
  role_id?: number | null;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface MembershipListParams {
  search?: string;
  page?: number;
  per_page?: number;
}
