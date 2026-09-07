import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse, Paginated } from "@/types/api.type";
import type { User } from "@/types/models/user.model";
import type { TransactionSummaryModel } from "@/types/models/transaction.model";

export interface MemberDashboardData {
  wallet: { balance: number; points: number };
  stats: {
    total: number;
    pending: number;
    process: number;
    success: number;
    failed: number;
  };
  total_spent: number;
  recent_transactions: TransactionSummaryModel[];
}

export interface MemberActivityLogRow {
  id: number;
  type: string | null;
  actor: string;
  role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  message: string;
  created_at: string;
}

export interface MemberTransactionFilters {
  status?: string;
  payment_channel_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort?: string;
  per_page?: number;
  page?: number;
}

const BASE = `${API_VERSION}/me`;

export const memberService = {
  dashboard: async (): Promise<ApiResponse<MemberDashboardData>> => {
    return await api.get(`${BASE}/dashboard`);
  },

  transactions: async (
    params: MemberTransactionFilters,
  ): Promise<ApiResponse<Paginated<TransactionSummaryModel>>> => {
    return await api.get(`${BASE}/transactions`, { params });
  },

  activityLogs: async (params: {
    type?: string;
    ip?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<Paginated<MemberActivityLogRow>>> => {
    return await api.get(`${BASE}/activity-logs`, { params });
  },

  updateProfile: async (data: FormData | Record<string, unknown>): Promise<ApiResponse<User>> => {
    // Multipart when an avatar file is attached; Laravel's PUT does not parse
    // multipart bodies, so the method is spoofed via _method on a POST.
    if (data instanceof FormData) {
      data.append("_method", "PUT");
      return await api.post(BASE, data, { headers: { "Content-Type": "multipart/form-data" } });
    }

    return await api.put(BASE, data);
  },

  updatePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse<null>> => {
    return await api.put(`${BASE}/password`, data);
  },
};
