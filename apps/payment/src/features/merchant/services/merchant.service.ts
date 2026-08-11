import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type {
  CreateWithdrawalPayload,
  MerchantDashboard,
  MerchantMutation,
  MerchantTransaction,
  Withdrawal,
} from "../types/merchant.type";

const BASE = `${API_VERSION}/payment-admin`;

export const merchantService = {
  dashboard: async (): Promise<MerchantDashboard> => {
    const res: ApiResponse<MerchantDashboard> = await api.get(`${BASE}/dashboard`);
    return res.data;
  },

  transactions: async (params: ListParams): Promise<ListResult<MerchantTransaction>> => {
    const res = await api.get(`${BASE}/transactions`, { params });
    return unwrapList<MerchantTransaction>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  mutations: async (params: ListParams): Promise<ListResult<MerchantMutation>> => {
    const res = await api.get(`${BASE}/mutations`, { params });
    return unwrapList<MerchantMutation>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  withdrawals: async (params: ListParams): Promise<ListResult<Withdrawal>> => {
    const res = await api.get(`${BASE}/withdrawals`, { params });
    return unwrapList<Withdrawal>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  createWithdrawal: async (payload: CreateWithdrawalPayload): Promise<Withdrawal> => {
    const res: ApiResponse<Withdrawal> = await api.post(`${BASE}/withdrawals`, payload);
    return res.data;
  },
};
