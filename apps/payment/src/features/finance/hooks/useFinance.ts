import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { financeService } from "../services/finance.service";
import type { IncidentPayload, ServicePayload } from "../types/finance.type";

export const useFinanceDashboard = () =>
  useQuery({ queryKey: ["finance", "dashboard"], queryFn: financeService.dashboard });

export const useFinanceMerchants = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "merchants", params], queryFn: () => financeService.merchants(params) });

export const useFinanceTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "transactions", params], queryFn: () => financeService.transactions(params) });

export const useFinanceWithdrawals = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "withdrawals", params], queryFn: () => financeService.withdrawals(params) });

export const useApproveWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method, proof }: { id: number; method?: "manual" | "monetapay"; proof?: File }) =>
      financeService.approve(id, { method, proof }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Penarikan disetujui");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menyetujui penarikan");
    },
  });
};

export const useRejectWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => financeService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Penarikan ditolak, dana dikembalikan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menolak penarikan");
    },
  });
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const useChannelFees = () =>
  useQuery({ queryKey: ["finance", "channels"], queryFn: financeService.channels });

export const useUpdateChannelFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { fee_flat?: number; fee_percent?: number; is_active?: boolean };
    }) => financeService.updateChannel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "channels"] });
      toast.success("Biaya channel berhasil disimpan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menyimpan biaya channel");
    },
  });
};

// ── Services, invoices, subscriptions & incidents ────────────────────────────

export const useFinanceServices = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "services", params], queryFn: () => financeService.services(params) });

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => financeService.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success("Service berhasil dibuat");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat service");
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServicePayload> }) =>
      financeService.updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success("Service berhasil diperbarui");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal memperbarui service");
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success("Service berhasil dihapus");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menghapus service");
    },
  });
};

export const useServiceInvoices = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "service-invoices", params],
    queryFn: () => financeService.serviceInvoices(params),
  });

export const useConfirmServiceInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.confirmServiceInvoice(id),
    onSuccess: () => {
      // Confirming also creates a subscription, so the whole namespace refreshes.
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Invoice dikonfirmasi, langganan aktif");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal mengkonfirmasi invoice");
    },
  });
};

export const useRejectServiceInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      financeService.rejectServiceInvoice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "service-invoices"] });
      toast.success("Invoice ditolak");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menolak invoice");
    },
  });
};

export const useServiceSubscriptions = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "service-subscriptions", params],
    queryFn: () => financeService.serviceSubscriptions(params),
  });

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "service-subscriptions"] });
      toast.success("Langganan dibatalkan");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membatalkan langganan");
    },
  });
};

export const useIncidents = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "incidents", params], queryFn: () => financeService.incidents(params) });

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncidentPayload) => financeService.createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success("Insiden berhasil dibuat");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat insiden");
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<IncidentPayload> }) =>
      financeService.updateIncident(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success("Insiden berhasil diperbarui");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal memperbarui insiden");
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success("Insiden berhasil dihapus");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menghapus insiden");
    },
  });
};
