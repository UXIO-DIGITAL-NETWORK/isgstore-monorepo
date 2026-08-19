import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListParams } from "@/lib/list";
import { merchantService } from "../services/merchant.service";
import type { CreateWithdrawalPayload } from "../types/merchant.type";

export const useMerchantDashboard = () =>
  useQuery({ queryKey: ["merchant", "dashboard"], queryFn: merchantService.dashboard });

export const useMerchantTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "transactions", params], queryFn: () => merchantService.transactions(params) });

export const useMerchantTransactionSummary = (params: ListParams) =>
  useQuery({
    queryKey: ["merchant", "transactions", "summary", params],
    queryFn: () => merchantService.transactionSummary(params),
  });

export const useMerchantMutations = (params: ListParams) =>
  useQuery({ queryKey: ["merchant", "mutations", params], queryFn: () => merchantService.mutations(params) });

/**
 * Polls while any payout is still in flight. A Monetapay disbursement settles
 * asynchronously (PENDING → PROCESSING → SETTLED/FAILED via webhook), so the
 * list keeps refreshing until every row reaches a terminal state — the server
 * decides that, never a client-side guess.
 */
export const useMerchantWithdrawals = (params: ListParams) =>
  useQuery({
    queryKey: ["merchant", "withdrawals", params],
    queryFn: () => merchantService.withdrawals(params),
    refetchInterval: (query) =>
      query.state.data?.rows.some((w) => w.status === "PENDING" || w.status === "PROCESSING") ? 5_000 : false,
  });

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

export const useServicePaymentChannels = () =>
  useQuery({
    queryKey: ["merchant", "payment-channels"],
    queryFn: merchantService.paymentChannels,
    // The method list changes when kita edits a channel, not while a client is
    // picking one.
    staleTime: 5 * 60_000,
  });

export const useSubscribeService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { service_id: number; payment_channel_id: number; notes?: string }) =>
      merchantService.subscribe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success("Invoice dibuat, silakan selesaikan pembayaran");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuat langganan");
    },
  });
};

export const usePayServiceInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentChannelId }: { id: number; paymentChannelId: number }) =>
      merchantService.payInvoice(id, paymentChannelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success("Pembayaran baru dibuka");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Gagal membuka pembayaran");
    },
  });
};

export const useServiceStatus = () =>
  useQuery({ queryKey: ["merchant", "service-status"], queryFn: merchantService.serviceStatus });

// ── Checkout, invoice detail & installation ─────────────────────────────────

export const useMerchantServiceDetail = (id: number) =>
  useQuery({ queryKey: ["merchant", "service-detail", id], queryFn: () => merchantService.serviceDetail(id) });

/**
 * Polls while the bill is still open.
 *
 * Stops on a status the *server* declares terminal, never on one re-derived
 * here — a client-side guess about what "settled" means would eventually
 * disagree with the webhook that decided it.
 */
export const useMerchantServiceInvoice = (id: number) =>
  useQuery({
    queryKey: ["merchant", "service-invoice", id],
    queryFn: () => merchantService.serviceInvoice(id),
    refetchInterval: (query) => (query.state.data?.status === "UNPAID" ? 5_000 : false),
    refetchIntervalInBackground: true,
  });

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
