import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEchoConnected } from "@/hooks/useEchoConnected";
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
 * Realtime-primary: the `merchant.{id}.withdrawals` Pusher channel invalidates
 * this on every status change (see usePaymentRealtime). Polling stays only as a
 * fallback while a payout is mid-flight — slow when the socket is up, fast when
 * it's down. The server owns the terminal state, never a client-side guess.
 */
export const useMerchantWithdrawals = (params: ListParams) => {
  const connected = useEchoConnected();
  return useQuery({
    queryKey: ["merchant", "withdrawals", params],
    queryFn: () => merchantService.withdrawals(params),
    refetchInterval: (query) => {
      const inFlight = query.state.data?.rows.some((w) => w.status === "PENDING" || w.status === "PROCESSING");
      if (!inFlight) return false;
      return connected ? 30_000 : 5_000;
    },
  });
};

export const useCreateWithdrawal = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWithdrawalPayload) => merchantService.createWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success(t("toast.withdrawalCreated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.withdrawalCreateFailed"));
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

/**
 * The bill list. Realtime pushes invalidate this (usePaymentRealtime) and that
 * is the fast path — but it is also the ONLY path today, and a list nothing
 * polls is a list that stays empty until a reload whenever the socket is down.
 * A Hub-issued bill arriving is exactly the case this must not miss.
 *
 * So the interval is the fallback: 5s while realtime is unavailable, 30s as a
 * cheap backstop once it is up — the same shape as useMerchantServiceInvoice.
 * `refetchIntervalInBackground` because the app disables refetchOnWindowFocus
 * globally (main.tsx), so a merchant coming back to the tab would otherwise
 * read a stale list until the next tick.
 */
export const useMerchantServiceInvoices = (params: ListParams) => {
  const connected = useEchoConnected();

  return useQuery({
    queryKey: ["merchant", "service-invoices", params],
    queryFn: () => merchantService.serviceInvoices(params),
    refetchInterval: connected ? 30_000 : 5_000,
    refetchIntervalInBackground: true,
  });
};

/**
 * The plan, read from this site's own cache of it. No Hub call on a page load,
 * and the page keeps working while the Hub is unreachable.
 */
export const useServicePlan = () =>
  useQuery({
    queryKey: ["merchant", "service-plan"],
    queryFn: merchantService.servicePlan,
  });

export const usePayInvoiceBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceIds, channelId }: { invoiceIds: number[]; channelId: number }) =>
      merchantService.payInvoiceBatch(invoiceIds, channelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant"] }),
  });
};

/**
 * One attempt and every bill it covers. Polled while PENDING, exactly like the
 * single-invoice page — and stopped by the SERVER's status, never by a
 * client-side clock.
 */
export const useServicePayment = (reference: string) =>
  useQuery({
    queryKey: ["merchant", "service-payment", reference],
    queryFn: () => merchantService.servicePayment(reference),
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 5_000 : false),
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
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { service_id: number; payment_channel_id: number; notes?: string }) =>
      merchantService.subscribe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success(t("toast.invoiceOpened"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.subscriptionCreateFailed"));
    },
  });
};

export const usePayServiceInvoice = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentChannelId }: { id: number; paymentChannelId: number }) =>
      merchantService.payInvoice(id, paymentChannelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      toast.success(t("toast.paymentReopened"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.paymentReopenFailed"));
    },
  });
};

export const useServiceStatus = () =>
  useQuery({ queryKey: ["merchant", "service-status"], queryFn: merchantService.serviceStatus });

// ── Checkout, invoice detail & installation ─────────────────────────────────

export const useMerchantServiceDetail = (id: number) =>
  useQuery({ queryKey: ["merchant", "service-detail", id], queryFn: () => merchantService.serviceDetail(id) });

/**
 * Realtime-primary: the `merchant.{id}.service-invoices` Pusher channel
 * invalidates this the moment the webhook flips the bill to PAID. Polling stays
 * as a fallback while it is still UNPAID — slow when the socket is up, fast when
 * it's down. Stops on a status the *server* declares terminal, never a
 * client-side guess.
 */
export const useMerchantServiceInvoice = (id: number) => {
  const connected = useEchoConnected();
  return useQuery({
    queryKey: ["merchant", "service-invoice", id],
    queryFn: () => merchantService.serviceInvoice(id),
    refetchInterval: (query) => {
      if (query.state.data?.status !== "UNPAID") return false;
      return connected ? 30_000 : 5_000;
    },
    refetchIntervalInBackground: true,
  });
};

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
export const useRevealDetail = () => {
  const { t } = useTranslation("common");

  return useMutation({
    mutationFn: (id: number) => merchantService.revealDetail(id),
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.revealFailed"));
    },
  });
};
