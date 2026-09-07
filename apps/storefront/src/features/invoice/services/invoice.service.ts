import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";
import type { ApiResponse } from "@/types/api.type";
import type { InvoiceModel } from "@/types/models/transaction.model";

export interface SubmitRatingPayload {
  invoiceNumber: string;
  rating: number;
  comment?: string;
}

export const invoiceService = {
  /** Public receipt lookup — no auth, the invoice number is the credential. */
  show: async (invoiceNumber: string): Promise<ApiResponse<InvoiceModel>> => {
    return await api.get(`${API_VERSION}/invoices/${invoiceNumber}`);
  },

  /**
   * Post-purchase review, keyed on the invoice number — the only order
   * identifier the storefront holds. Members submit through the auth-scoped
   * `/me/...` path; guests (no token) use the public one, where the API
   * generates a "Guest <letter><digits>" author name. Either way the author is
   * resolved server-side, never sent from here.
   *
   * The API only accepts a rating for a COMPLETED transaction, and only once
   * per transaction — both are enforced there, not here.
   */
  submitRating: async ({
    invoiceNumber,
    rating,
    comment,
  }: SubmitRatingPayload): Promise<ApiResponse<null>> => {
    const isGuest = !useAuthStore.getState().token;
    const path = isGuest
      ? `${API_VERSION}/transactions/${invoiceNumber}/rating`
      : `${API_VERSION}/me/transactions/${invoiceNumber}/rating`;

    return await api.post(path, { rating, comment });
  },
};
