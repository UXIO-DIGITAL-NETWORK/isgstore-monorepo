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

export const walletService = {
  createTopup: async (input: { amount: number; payment_channel_id: number }): Promise<ApiResponse<TopupResult>> =>
    await api.post(`${API_VERSION}/me/topups`, input),

  topup: async (reference: string): Promise<ApiResponse<TopupResult & { is_terminal: boolean }>> =>
    await api.get(`${API_VERSION}/me/topups/${reference}`),
};
