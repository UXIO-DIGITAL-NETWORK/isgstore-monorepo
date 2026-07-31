import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** One row of `GET /v1/storefront/promos` — public codes only. */
export interface PromoModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  max_discount: number | null;
  min_purchase: number;
  ends_at: string | null;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  name?: string;
  discount_amount: number;
}

/** Codes the storefront may advertise. Private codes are deliberately absent —
 * a code the customer must already know would not be a code if it were listed. */
export const usePublicPromosQuery = () =>
  useQuery({
    queryKey: ["promos", "public"],
    queryFn: async (): Promise<ApiResponse<PromoModel[]>> => await api.get(`${API_VERSION}/storefront/promos`),
  });

/**
 * Validation answers 200 with a `valid` flag rather than a 4xx — an invalid
 * coupon is a normal outcome of typing one, and the message is what the form
 * shows inline.
 */
export const useValidatePromoMutation = () =>
  useMutation({
    mutationFn: async (input: {
      code: string;
      product_id?: number;
      amount?: number;
    }): Promise<ApiResponse<PromoValidationResult>> =>
      await api.post(`${API_VERSION}/storefront/promos/validate`, input),
  });
