import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import { isWithdrawalInFlight } from "@/lib/withdrawalStatus";
import type { ListParams } from "@/lib/list";
import { merchantService } from "../services/merchant.service";
import type { CreateWithdrawalPayload } from "../types/merchant.type";

/**
 * The landing screen's figures.
 *
 * Realtime covers the events we subscribe to (a payout settling invalidates
 * this), but the balances also move on things nobody pushes: a sale landing, a
 * holding period expiring. So a slow poll is the backstop and the page's own
 * refresh button is for impatience — it is the difference between a monitoring
 * screen and a snapshot.
 */
export const useMerchantDashboard = () =>
  useQuery({
    queryKey: ["merchant", "dashboard"],
    queryFn: merchantService.dashboard,
    refetchInterval: 60_000,
  });

/**
 * The sales feed.
 *
 * No websocket channel carries a merchant's transactions yet — `channels.php`
 * declares `merchant.{id}.withdrawals` and `merchant.{id}.service-invoices`, and
 * nothing else — so this list is poll-driven for now. 30s is therefore what the
 * page can honestly promise, and it is also what keeps the dashboard's
 * "Aktivitas terbaru" honest; the alternative today is a manual reload.
 *
 * `refetchIntervalInBackground` because the app disables refetchOnWindowFocus
 * globally (main.tsx), so a merchant returning to the tab would otherwise read
 * a stale list until the next tick.
 */
export const useMerchantTransactions = (params: ListParams) =>
  useQuery({
    queryKey: ["merchant", "transactions", params],
    queryFn: () => merchantService.transactions(params),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

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
      // APPROVED counts as in flight: the payout has cleared us and is on its
      // way, which is exactly when a client is watching the row.
      const inFlight = query.state.data?.rows.some((w) => isWithdrawalInFlight(w.status));
      if (!inFlight) return false;
      return connected ? 30_000 : 5_000;
    },
  });
};

/**
 * One payout, opened from its row in the list.
 *
 * Polled while it is still moving, exactly like the list: a payout that settles
 * while the client is looking at it should say so, and the server owns the
 * terminal state. Once it is SETTLED/REJECTED/FAILED the interval stops — a
 * finished payout does not change again.
 */
export const useMerchantWithdrawal = (number: string) => {
  const connected = useEchoConnected();

  return useQuery({
    queryKey: ["merchant", "withdrawal", number],
    queryFn: () => merchantService.withdrawal(number),
    enabled: Boolean(number),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const inFlight = status === "PENDING" || status === "APPROVED" || status === "PROCESSING";
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
 * So the interval is the fallback, set to the one-minute rule the whole
 * Hub↔site loop runs on: the site pulls the plan every minute and issues the
 * bill, and this reads it back within the same cadence. `refetchIntervalInBackground`
 * because the app disables refetchOnWindowFocus globally (main.tsx), so a
 * merchant coming back to the tab would otherwise read a stale list until the
 * next tick.
 */
export const useMerchantServiceInvoices = (params: ListParams) => {
  return useQuery({
    queryKey: ["merchant", "service-invoices", params],
    queryFn: () => merchantService.serviceInvoices(params),
    refetchInterval: 60_000,
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
 * as a fallback while it is still UNPAID, at the same one-minute rule as the
 * list. Stops on a status the *server* declares terminal, never a client-side
 * guess.
 */
export const useMerchantServiceInvoice = (id: number) => {
  return useQuery({
    queryKey: ["merchant", "service-invoice", id],
    queryFn: () => merchantService.serviceInvoice(id),
    refetchInterval: (query) => {
      if (query.state.data?.status !== "UNPAID") return false;
      return 60_000;
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
