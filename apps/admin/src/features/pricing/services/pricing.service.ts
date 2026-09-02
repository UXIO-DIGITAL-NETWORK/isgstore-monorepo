import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse } from "@/types/api.type";
import type { CategoryOption, PlanOption, PricingRule, PricingRuleInput } from "../types/pricingRule.type";

const BASE = `${API_VERSION}/pricing-rules`;

interface PricingRuleApiRow {
  id: number;
  category_id: number | null;
  membership_plan_id: number | null;
  markup_percent: number | string;
  markup_flat: number | string;
  category?: { id: number; name: string; code?: string } | null;
  membership_plan?: { id: number; code: string; name?: unknown } | null;
}

/** The plan name is locale-keyed JSON on the API; fall back to the code. */
const planLabel = (plan: PricingRuleApiRow["membership_plan"]): string | null => {
  if (!plan) return null;
  const name = plan.name as Record<string, string> | string | null | undefined;
  if (typeof name === "string") return name;
  return name?.id ?? name?.en ?? plan.code;
};

const toRule = (row: PricingRuleApiRow): PricingRule => ({
  id: toRowId(row.id),
  category_id: row.category_id,
  category_name: row.category?.name ?? null,
  membership_plan_id: row.membership_plan_id,
  plan_name: planLabel(row.membership_plan),
  markup_percent: Number(row.markup_percent),
  markup_flat: Number(row.markup_flat),
});

export const pricingService = {
  /** The index is a plain (non-paginated) collection of every rule. */
  list: async (): Promise<PricingRule[]> => {
    const response: ApiResponse<PricingRuleApiRow[]> = await api.get(BASE);
    return response.data.map(toRule);
  },
  create: async (input: PricingRuleInput): Promise<PricingRule> => {
    const response: ApiResponse<PricingRuleApiRow> = await api.post(BASE, input);
    return toRule(response.data);
  },
  update: async (id: string, input: PricingRuleInput): Promise<PricingRule> => {
    const response: ApiResponse<PricingRuleApiRow> = await api.put(`${BASE}/${id}`, input);
    return toRule(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
  /**
   * The membership plans a rule can target. Fetched here rather than imported
   * from the membership feature: one feature must never import another's
   * service, and this projection is only what the select needs.
   */
  planOptions: async (): Promise<PlanOption[]> => {
    const response: ApiResponse<{ data: { id: number; code: string; name?: unknown; is_default?: boolean }[] }> =
      await api.get(`${API_VERSION}/membership-plans`, { params: { per_page: 100 } });

    return response.data.data.map((plan) => ({
      value: String(plan.id),
      label: planLabel({ id: plan.id, code: plan.code, name: plan.name }) ?? plan.code,
      is_default: Boolean(plan.is_default),
    }));
  },

  /** Lightweight category list for the rule form's optional category select. */
  categoryOptions: async (): Promise<CategoryOption[]> => {
    const response: ApiResponse<{ data: { id: number; name: string }[] }> = await api.get(`${API_VERSION}/categories`, {
      params: { per_page: 100 },
    });
    return response.data.data.map((c) => ({ value: String(c.id), label: c.name }));
  },
};
