import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type { Withdrawal } from "@/types/withdrawal.type";
import type {
  ChannelFee,
  FinanceDashboard,
  FinanceMerchant,
  FinanceTransaction,
  IncidentPayload,
  Service,
  ServiceIncident,
  ServiceInvoice,
  ServicePayload,
  ServiceSubscription,
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

  approve: async (
    id: number,
    { method = "manual", proof }: { method?: "manual" | "monetapay"; proof?: File } = {},
  ): Promise<Withdrawal> => {
    // Manual settlement carries the bukti transfer, so it goes as multipart.
    // The axios request interceptor drops the pinned JSON Content-Type for
    // FormData so the browser sets `multipart/form-data; boundary=…`.
    const form = new FormData();
    form.append("method", method);
    if (proof) form.append("proof", proof);

    const res: ApiResponse<Withdrawal> = await api.post(`${BASE}/withdrawals/${id}/approve`, form);
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

  // ── Services, invoices, subscriptions & incidents ──────────────────────────

  services: async (params: ListParams): Promise<ListResult<Service>> => {
    const res = await api.get(`${BASE}/services`, { params });
    return unwrapList<Service>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  createService: async (payload: ServicePayload): Promise<Service> => {
    const res: ApiResponse<Service> = await api.post(`${BASE}/services`, payload);
    return res.data;
  },

  updateService: async (id: number, payload: Partial<ServicePayload>): Promise<Service> => {
    const res: ApiResponse<Service> = await api.put(`${BASE}/services/${id}`, payload);
    return res.data;
  },

  deleteService: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/services/${id}`);
  },

  serviceInvoices: async (params: ListParams): Promise<ListResult<ServiceInvoice>> => {
    const res = await api.get(`${BASE}/service-invoices`, { params });
    return unwrapList<ServiceInvoice>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  confirmServiceInvoice: async (id: number): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices/${id}/confirm`, {});
    return res.data;
  },

  rejectServiceInvoice: async (id: number, reason?: string): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices/${id}/reject`, { reason });
    return res.data;
  },

  serviceSubscriptions: async (params: ListParams): Promise<ListResult<ServiceSubscription>> => {
    const res = await api.get(`${BASE}/service-subscriptions`, { params });
    return unwrapList<ServiceSubscription>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  cancelSubscription: async (id: number): Promise<ServiceSubscription> => {
    const res: ApiResponse<ServiceSubscription> = await api.post(`${BASE}/service-subscriptions/${id}/cancel`, {});
    return res.data;
  },

  incidents: async (params: ListParams): Promise<ListResult<ServiceIncident>> => {
    const res = await api.get(`${BASE}/incidents`, { params });
    return unwrapList<ServiceIncident>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  createIncident: async (payload: IncidentPayload): Promise<ServiceIncident> => {
    const res: ApiResponse<ServiceIncident> = await api.post(`${BASE}/incidents`, payload);
    return res.data;
  },

  updateIncident: async (id: number, payload: Partial<IncidentPayload>): Promise<ServiceIncident> => {
    const res: ApiResponse<ServiceIncident> = await api.put(`${BASE}/incidents/${id}`, payload);
    return res.data;
  },

  deleteIncident: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/incidents/${id}`);
  },
};
