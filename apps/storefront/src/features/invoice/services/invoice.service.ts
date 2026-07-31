import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { InvoiceModel } from "@/types/models/transaction.model";

export const invoiceService = {
  /** Public receipt lookup — no auth, the invoice number is the credential. */
  show: async (invoiceNumber: string): Promise<ApiResponse<InvoiceModel>> => {
    return await api.get(`${API_VERSION}/invoices/${invoiceNumber}`);
  },
};
