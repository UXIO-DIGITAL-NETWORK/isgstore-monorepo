import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse } from "@/types/api.type";
import type { CategoryOption, PricingRule, PricingRuleInput } from "../types/pricingRule.type";

const BASE = `${API_VERSION}/pricing-rules`;

interface PricingRuleApiRow {
  id: number;
  category_id: number | null;
  role: PricingRule["role"];
  markup_percent: number | string;
  markup_flat: number | string;
  category?: { id: number; name: string; code?: string } | null;
}

const toRule = (row: PricingRuleApiRow): PricingRule => ({
  id: toRowId(row.id),
  category_id: row.category_id,
  category_name: row.category?.name ?? null,
  role: row.role,
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
  /** Lightweight category list for the rule form's optional category select. */
  categoryOptions: async (): Promise<CategoryOption[]> => {
    const response: ApiResponse<{ data: { id: number; name: string }[] }> = await api.get(`${API_VERSION}/categories`, {
      params: { per_page: 100 },
    });
    return response.data.data.map((c) => ({ value: String(c.id), label: c.name }));
  },
};
