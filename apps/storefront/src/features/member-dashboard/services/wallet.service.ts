import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

export interface TopupResult {
  reference_id: string;
  amount: number;
  admin_fee: number;
  total: number;
  status: string;
  payment: {
    channel: string;
    channel_code: string;
    type: string;
    instructions: Record<string, string> | null;
  };
}

/** One row of `GET /v1/me/balance-mutations`. `amount` is signed: a debit is negative. */
export interface BalanceMutationModel {
  id: number;
  type: "topup" | "purchase" | "refund" | "adjustment" | "settlement" | string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  created_at: string;
}

export const walletService = {
  createTopup: async (input: { amount: number; payment_channel_id: number }): Promise<ApiResponse<TopupResult>> =>
    await api.post(`${API_VERSION}/me/topups`, input),

  topup: async (reference: string): Promise<ApiResponse<TopupResult & { is_terminal: boolean }>> =>
    await api.get(`${API_VERSION}/me/topups/${reference}`),

  /**
   * The member's balance statement. Worth showing now that refunds land here:
   * a balance that silently grows is indistinguishable from a bug, and
   * "Refund INV-…" is the line that explains it.
   */
  mutations: async (): Promise<ApiResponse<{ data: BalanceMutationModel[] }>> =>
    await api.get(`${API_VERSION}/me/balance-mutations`),
};
