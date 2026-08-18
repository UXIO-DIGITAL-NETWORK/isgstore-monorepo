import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type { TransactionSummary, UnifiedTransaction } from "@/types/transaction.type";
import type { ServiceCheckout, ServiceInstallation, ServicePaymentChannel } from "@/types/service.type";
import type {
  CreateWithdrawalPayload,
  MerchantDashboard,
  MerchantMutation,
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

  transactions: async (params: ListParams): Promise<ListResult<UnifiedTransaction>> => {
    const res = await api.get(`${BASE}/transactions`, { params });
    return unwrapList<UnifiedTransaction>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  transactionSummary: async (params: ListParams): Promise<TransactionSummary> => {
    const res: ApiResponse<TransactionSummary> = await api.get(`${BASE}/transactions/summary`, { params });
    return res.data;
  },

  /** CSV of the filtered set. The response interceptor hands back the Blob body. */
  exportTransactions: async (params: ListParams): Promise<Blob> => {
    return (await api.get(`${BASE}/transactions/export`, { params, responseType: "blob" })) as unknown as Blob;
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

  /** The methods a client may settle a bill with — gateway only, no wallet. */
  paymentChannels: async (): Promise<ServicePaymentChannel[]> => {
    const res: ApiResponse<ServicePaymentChannel[]> = await api.get(`${BASE}/payment-channels`);
    return res.data;
  },

  /** Issues the bill and opens its payment in one step. */
  subscribe: async (payload: {
    service_id: number;
    payment_channel_id: number;
    notes?: string;
  }): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices`, payload);
    return res.data;
  },

  /**
   * Re-opens payment on an unpaid bill — after a QR or VA expires, or when the
   * client wants a different method.
   */
  payInvoice: async (id: number, paymentChannelId: number): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.post(`${BASE}/service-invoices/${id}/pay`, {
      payment_channel_id: paymentChannelId,
    });
    return res.data;
  },

  serviceStatus: async (): Promise<ServiceStatusResponse> => {
    const res: ApiResponse<ServiceStatusResponse> = await api.get(`${BASE}/service-status`);
    return res.data;
  },
  serviceDetail: async (id: number): Promise<ServiceCheckout> => {
    const res: ApiResponse<ServiceCheckout> = await api.get(`${BASE}/services/${id}`);
    return res.data;
  },

  serviceInvoice: async (id: number): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.get(`${BASE}/service-invoices/${id}`);
    return res.data;
  },

  installation: async (subscriptionId: number): Promise<ServiceInstallation | null> => {
    const res: ApiResponse<ServiceInstallation | null> = await api.get(
      `${BASE}/service-subscriptions/${subscriptionId}/installation`,
    );
    return res.data;
  },

  /**
   * The only call that returns a credential in the clear. POST so it is neither
   * proxy-cacheable nor logged in a URL; must be driven by a mutation so the
   * plaintext never lands in the query cache.
   */
  revealDetail: async (id: number): Promise<string> => {
    const res: ApiResponse<{ id: number; value: string }> = await api.post(
      `${BASE}/installation-details/${id}/reveal`,
      {},
    );
    return res.data.value;
  },
};
