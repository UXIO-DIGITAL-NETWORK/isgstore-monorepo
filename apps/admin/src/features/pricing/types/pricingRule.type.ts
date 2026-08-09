/** Role-based markup rules (backend `pricing_rules`) that drive suggested prices. */

export const PRICING_ROLES = ["member", "vip", "reseller", "agent"] as const;
export type PricingRole = (typeof PRICING_ROLES)[number];

export interface PricingRule {
  id: string;
  /** null = the global fallback rule for the role. */
  category_id: number | null;
  category_name: string | null;
  role: PricingRole;
  markup_percent: number;
  markup_flat: number;
}

export interface PricingRuleInput {
  category_id: number | null;
  role: PricingRole;
  markup_percent: number;
  markup_flat: number;
}

export interface CategoryOption {
  value: string;
  label: string;
}
