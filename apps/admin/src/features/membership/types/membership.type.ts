/** Membership/loyalty tiers (product_requirements.md §5 — scope TBD, first slice). */

export interface MembershipTier {
  id: string;
  name: string;
  /** Minimum lifetime spend to reach this tier. */
  min_spend: number;
  /** Discount granted to members of this tier. */
  discount_percent: number;
  benefits?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipListParams {
  search?: string;
  page?: number;
  per_page?: number;
}
