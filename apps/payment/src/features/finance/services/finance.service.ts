import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type { Withdrawal } from "@/types/withdrawal.type";
import type { FinanceDashboard, FinanceMerchant, FinanceTransaction } from "../types/finance.type";

const BASE = `${API_VERSION}/finance`;

export const financeService = {
  dashboard: async (): Promise<FinanceDashboard> => {
    const res: ApiResponse<FinanceDashboard> = await api.get(`${BASE}/dashboard`);
    return res.data;
  },

  merchants: async (params: ListParams): Promise<ListResult<FinanceMerchant>> => {
    const res = await api.get(`${BASE}/merchants`, { params });
    return unwrapList<FinanceMerchant>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  transactions: async (params: ListParams): Promise<ListResult<FinanceTransaction>> => {
    const res = await api.get(`${BASE}/transactions`, { params });
    return unwrapList<FinanceTransaction>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  withdrawals: async (params: ListParams): Promise<ListResult<Withdrawal>> => {
    const res = await api.get(`${BASE}/withdrawals`, { params });
    return unwrapList<Withdrawal>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  approve: async (id: number, method: "manual" | "monetapay" = "manual"): Promise<Withdrawal> => {
    const res: ApiResponse<Withdrawal> = await api.post(`${BASE}/withdrawals/${id}/approve`, { method });
    return res.data;
  },

  reject: async (id: number, reason?: string): Promise<Withdrawal> => {
    const res: ApiResponse<Withdrawal> = await api.post(`${BASE}/withdrawals/${id}/reject`, { reason });
    return res.data;
  },
};
