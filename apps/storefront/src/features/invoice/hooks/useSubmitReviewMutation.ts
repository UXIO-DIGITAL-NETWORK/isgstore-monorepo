import { useMutation } from "@tanstack/react-query";
import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";
import type { ApiResponse } from "@/types/api.type";

interface SubmitReviewPayload {
  invoiceNumber: string;
  rating: number;
  comment?: string;
}

/**
 * Post-purchase review.
 *
 * Keyed on the invoice number — the only order identifier the storefront holds.
 * Members submit through the auth-scoped `/me/...` path; guests (no token) use
 * the public path, where the API generates a "Guest <letter><digits>" author
 * name. Either way the name is resolved server-side, never sent from here.
 */
export const useSubmitReviewMutation = () =>
  useMutation({
    mutationFn: async ({ invoiceNumber, rating, comment }: SubmitReviewPayload): Promise<ApiResponse<null>> => {
      const isGuest = !useAuthStore.getState().token;
      const path = isGuest
        ? `${API_VERSION}/transactions/${invoiceNumber}/rating`
        : `${API_VERSION}/me/transactions/${invoiceNumber}/rating`;

      return await api.post(path, { rating, comment });
    },
  });
