import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type { Withdrawal } from "@/types/withdrawal.type";
import type {
  AdminFeeSetting,
  ChannelFee,
  FinanceDashboard,
  FinanceMerchant,
  FinanceTransaction,
} from "../types/finance.type";

const BASE = `${API_VERSION}/payment-internal`;

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

  // ── Settings ──────────────────────────────────────────────────────────────
  channels: async (): Promise<ChannelFee[]> => {
    const res: ApiResponse<ChannelFee[]> = await api.get(`${BASE}/channels`);
    return res.data;
  },

  updateChannel: async (
    id: number,
    payload: Partial<Pick<ChannelFee, "fee_flat" | "fee_percent" | "is_active">>,
  ): Promise<ChannelFee> => {
    const res: ApiResponse<ChannelFee> = await api.put(`${BASE}/channels/${id}`, payload);
    return res.data;
  },

  adminFee: async (): Promise<AdminFeeSetting> => {
    const res: ApiResponse<AdminFeeSetting> = await api.get(`${BASE}/settings/admin-fee`);
    return res.data;
  },

  updateAdminFee: async (payload: AdminFeeSetting): Promise<AdminFeeSetting> => {
    const res: ApiResponse<AdminFeeSetting> = await api.put(`${BASE}/settings/admin-fee`, payload);
    return res.data;
  },
};
