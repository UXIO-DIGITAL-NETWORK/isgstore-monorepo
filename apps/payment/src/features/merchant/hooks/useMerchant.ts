import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { merchantService } from "../services/merchant.service";
import type { CreateWithdrawalPayload } from "../types/merchant.type";

export const useMerchantDashboard = () =>
  useQuery({ queryKey: ["merchant", "dashboard"], queryFn: merchantService.dashboard });

export const useMerchantTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "transactions", params], queryFn: () => merchantService.transactions(params) });

export const useMerchantMutations = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "mutations", params], queryFn: () => merchantService.mutations(params) });

export const useMerchantWithdrawals = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "withdrawals", params], queryFn: () => merchantService.withdrawals(params) });

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWithdrawalPayload) => merchantService.createWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success("Permintaan penarikan berhasil dibuat");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat penarikan");
    },
  });
};

// ── Services bought from kita ────────────────────────────────────────────────

export const useMerchantServices = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "services", params], queryFn: () => merchantService.services(params) });

export const useMerchantSubscriptions = (params: ListParams) =>
  useQuery({
    queryKey: ["merchant", "service-subscriptions", params],
    queryFn: () => merchantService.subscriptions(params),
  });

export const useMerchantServiceInvoices = (params: ListParams) =>
  useQuery({
    queryKey: ["merchant", "service-invoices", params],
    queryFn: () => merchantService.serviceInvoices(params),
  });

export const useSubscribeService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { service_id: number; notes?: string }) => merchantService.subscribe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success("Invoice langganan dibuat, silakan unggah bukti transfer");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat langganan");
    },
  });
};

export const useUploadServiceProof = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, proof, notes }: { id: number; proof: File; notes?: string }) =>
      merchantService.uploadProof(id, proof, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "service-invoices"] });
      toast.success("Bukti transfer terkirim, menunggu konfirmasi");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal mengunggah bukti transfer");
    },
  });
};

export const useServiceStatus = () =>
  useQuery({ queryKey: ["merchant", "service-status"], queryFn: merchantService.serviceStatus });

// ── Checkout, invoice detail & installation ─────────────────────────────────

export const useMerchantServiceDetail = (id: number) =>
  useQuery({ queryKey: ["merchant", "service-detail", id], queryFn: () => merchantService.serviceDetail(id) });

export const useMerchantServiceInvoice = (id: number) =>
  useQuery({ queryKey: ["merchant", "service-invoice", id], queryFn: () => merchantService.serviceInvoice(id) });

export const useMerchantInstallation = (subscriptionId: number | undefined) =>
  useQuery({
    queryKey: ["merchant", "installation", subscriptionId],
    queryFn: () => merchantService.installation(subscriptionId as number),
    enabled: Boolean(subscriptionId),
  });

/**
 * A mutation on purpose, never a query: a cached query would put the plaintext
 * credential in the TanStack Query cache, where the devtools panel renders it.
 */
export const useRevealDetail = () =>
  useMutation({
    mutationFn: (id: number) => merchantService.revealDetail(id),
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal menampilkan nilai");
    },
  });
