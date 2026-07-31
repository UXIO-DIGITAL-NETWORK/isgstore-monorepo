import { useMutation } from "@tanstack/react-query";
import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

interface SubmitReviewPayload {
  invoiceNumber: string;
  rating: number;
  comment?: string;
}

/**
 * Post-purchase review.
 *
 * Keyed on the invoice number — the only order identifier the storefront holds
 * — and resolved server-side inside the caller's own transactions, so an
 * invoice belonging to someone else simply does not exist.
 */
export const useSubmitReviewMutation = () =>
  useMutation({
    mutationFn: async ({ invoiceNumber, rating, comment }: SubmitReviewPayload): Promise<ApiResponse<null>> => {
      return await api.post(`${API_VERSION}/me/transactions/${invoiceNumber}/rating`, {
        rating,
        comment,
      });
    },
  });
