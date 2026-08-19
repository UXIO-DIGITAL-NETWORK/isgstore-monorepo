import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapList, type ListParams, type ListResult } from "@/lib/list";
import type { ApiResponse } from "@/types/api.type";
import type { Withdrawal } from "@/types/withdrawal.type";
import type { FinanceTransactionSummary, FinanceUnifiedTransaction } from "@/types/transaction.type";
import type {
  InstallationDetailPayload,
  InstallationPayload,
  InstallationScope,
  InstallationStepPayload,
  ServiceInstallation,
  ServiceInstallationDetail,
  ServiceInstallationStep,
} from "@/types/service.type";
import type {
  ChannelFee,
  FinanceDashboard,
  FinanceMerchant,
  IncidentPayload,
  Service,
  ServiceIncident,
  ServiceInvoice,
  ServicePayload,
  ServiceSubscription,
} from "../types/finance.type";

const BASE = `${API_VERSION}/payment-internal`;

/** Both paths resolve to the same (merchant, service) installation row. */
const installationPath = (scope: InstallationScope) =>
  scope.by === "invoice"
    ? `${BASE}/service-invoices/${scope.id}/installation`
    : `${BASE}/service-subscriptions/${scope.id}/installation`;

export const financeService = {
  dashboard: async (): Promise<FinanceDashboard> => {
    const res: ApiResponse<FinanceDashboard> = await api.get(`${BASE}/dashboard`);
    return res.data;
  },

  merchants: async (params: ListParams): Promise<ListResult<FinanceMerchant>> => {
    const res = await api.get(`${BASE}/merchants`, { params });
    return unwrapList<FinanceMerchant>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  transactions: async (params: ListParams): Promise<ListResult<FinanceUnifiedTransaction>> => {
    const res = await api.get(`${BASE}/transactions`, { params });
    return unwrapList<FinanceUnifiedTransaction>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  transactionSummary: async (params: ListParams): Promise<FinanceTransactionSummary> => {
    const res: ApiResponse<FinanceTransactionSummary> = await api.get(`${BASE}/transactions/summary`, { params });
    return res.data;
  },

  /** CSV of the filtered set. The response interceptor hands back the Blob body. */
  exportTransactions: async (params: ListParams): Promise<Blob> => {
    return (await api.get(`${BASE}/transactions/export`, { params, responseType: "blob" })) as unknown as Blob;
  },

  withdrawals: async (params: ListParams): Promise<ListResult<Withdrawal>> => {
    const res = await api.get(`${BASE}/withdrawals`, { params });
    return unwrapList<Withdrawal>(res as unknown as ApiResponse<Record<string, unknown>>);
  },

  /**
   * Approve a pending withdrawal and fire the payout through Monetapay. The
   * backend holds the partner key, encrypts the disbursement payload, signs it,
   * and calls Monetapay; the row comes back PROCESSING with a `disbursement_ref`
   * and settles to SETTLED/FAILED asynchronously via the gateway webhook.
   */
  approve: async (id: number): Promise<Withdrawal> => {
    const res: ApiResponse<Withdrawal> = await api.post(`${BASE}/withdrawals/${id}/approve`, {
      method: "monetapay",
    });
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
    payload: Partial<Pick<ChannelFee, "fee_flat" | "fee_percent" | "gateway_fee_percent" | "is_active">>,
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

  // ── Installation: schedule, checklist, credentials ─────────────────────────

  subscription: async (id: number): Promise<ServiceSubscription> => {
    const res: ApiResponse<ServiceSubscription> = await api.get(`${BASE}/service-subscriptions/${id}`);
    return res.data;
  },

  serviceInvoice: async (id: number): Promise<ServiceInvoice> => {
    const res: ApiResponse<ServiceInvoice> = await api.get(`${BASE}/service-invoices/${id}`);
    return res.data;
  },

  installation: async (scope: InstallationScope): Promise<ServiceInstallation | null> => {
    const res: ApiResponse<ServiceInstallation | null> = await api.get(installationPath(scope));
    return res.data;
  },

  upsertInstallation: async (scope: InstallationScope, payload: InstallationPayload): Promise<ServiceInstallation> => {
    const res: ApiResponse<ServiceInstallation> = await api.put(installationPath(scope), payload);
    return res.data;
  },

  createStep: async (installationId: number, payload: InstallationStepPayload): Promise<ServiceInstallationStep> => {
    const res: ApiResponse<ServiceInstallationStep> = await api.post(
      `${BASE}/installations/${installationId}/steps`,
      payload,
    );
    return res.data;
  },

  updateStep: async (id: number, payload: Partial<InstallationStepPayload>): Promise<ServiceInstallationStep> => {
    const res: ApiResponse<ServiceInstallationStep> = await api.put(`${BASE}/installation-steps/${id}`, payload);
    return res.data;
  },

  /** Explicit state, not a toggle — two open tabs must converge. */
  setStepCompletion: async (id: number, completed: boolean): Promise<ServiceInstallationStep> => {
    const res: ApiResponse<ServiceInstallationStep> = await api.post(
      `${BASE}/installation-steps/${id}/completion`,
      { completed },
    );
    return res.data;
  },

  deleteStep: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/installation-steps/${id}`);
  },

  createDetailItem: async (
    installationId: number,
    payload: InstallationDetailPayload,
  ): Promise<ServiceInstallationDetail> => {
    const res: ApiResponse<ServiceInstallationDetail> = await api.post(
      `${BASE}/installations/${installationId}/detail-items`,
      payload,
    );
    return res.data;
  },

  updateDetailItem: async (
    id: number,
    payload: Partial<InstallationDetailPayload>,
  ): Promise<ServiceInstallationDetail> => {
    const res: ApiResponse<ServiceInstallationDetail> = await api.put(`${BASE}/installation-details/${id}`, payload);
    return res.data;
  },

  deleteDetailItem: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/installation-details/${id}`);
  },

  /** See the merchant twin: POST, and driven by a mutation, never cached. */
  revealDetail: async (id: number): Promise<string> => {
    const res: ApiResponse<{ id: number; value: string }> = await api.post(
      `${BASE}/installation-details/${id}/reveal`,
      {},
    );
    return res.data.value;
  },
};
