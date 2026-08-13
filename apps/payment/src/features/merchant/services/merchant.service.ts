import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type {
  CreateWithdrawalPayload,
  MerchantDashboard,
  MerchantMutation,
  MerchantTransaction,
  Service,
  ServiceInvoice,
  ServiceStatusResponse,
  ServiceSubscription,
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

  // ── Services bought from kita ──────────────────────────────────────────────

  services: async (params: ListParams): Promise<ListResult<Service>> => {
    const res = await api.get(`${BASE}/services`, { params });
    return unwrapList<Service>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  subscriptions: async (params: ListParams): Promise<ListResult<ServiceSubscription>> => {
    const res = await api.get(`${BASE}/service-subscriptions`, { params });
    return unwrapList<ServiceSubscription>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  serviceInvoices: async (params: ListParams): Promise<ListResult<ServiceInvoice>> => {
    const res = await api.get(`${BASE}/service-invoices`, { params });
    return unwrapList<ServiceInvoice>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  subscribe: async (payload: { service_id: number; notes?: string }): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices`, payload);
    return res.data;
  },

  /**
   * Multipart — the axios request interceptor drops the pinned JSON
   * Content-Type for FormData so the browser sets the boundary itself.
   */
  uploadProof: async (id: number, proof: File, notes?: string): Promise<ServiceInvoice> => {
    const form = new FormData();
    form.append("proof", proof);
    if (notes) form.append("notes", notes);

    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices/${id}/proof`, form);
    return res.data;
  },

  serviceStatus: async (): Promise<ServiceStatusResponse> => {
    const res: ApiResponse<ServiceStatusResponse> = await api.get(`${BASE}/service-status`);
    return res.data;
  },
};
