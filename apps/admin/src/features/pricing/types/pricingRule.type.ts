/**
 * Markup rules (backend `pricing_rules`) that drive suggested prices.
 *
 * Keyed on a **membership plan**, not a role. Roles capped the platform at four
 * tiers; plans are data, so the number of tiers is whatever the admin created.
 * A null plan means the rule applies to every plan — the fallback that keeps a
 * newly invented tier priced instead of unpriced.
 */

export interface PricingRule {
  id: string;
  /** null = every category. */
  category_id: number | null;
  category_name: string | null;
  /** null = every membership plan. */
  membership_plan_id: number | null;
  plan_name: string | null;
  markup_percent: number;
  markup_flat: number;
}

export interface PricingRuleInput {
  category_id: number | null;
  membership_plan_id: number | null;
  markup_percent: number;
  markup_flat: number;
}

export interface CategoryOption {
  value: string;
  label: string;
}

/** A membership plan, as the rule form needs to know it. */
export interface PlanOption {
  value: string;
  label: string;
  is_default: boolean;
}
