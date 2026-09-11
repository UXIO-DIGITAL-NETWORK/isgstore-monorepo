import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { ListParams } from "@/lib/list";
import { financeService } from "../services/finance.service";
import type {
  CreateInternalWithdrawalPayload,
  IncidentPayload,
  InstallationDetailPayload,
  InstallationPayload,
  InstallationScope,
  InstallationStepPayload,
  ServicePayload,
} from "../types/finance.type";

export const useFinanceDashboard = () =>
  useQuery({ queryKey: ["finance", "dashboard"], queryFn: financeService.dashboard });

export const useFinanceMerchants = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "merchants", params], queryFn: () => financeService.merchants(params) });

export const useFinanceTransactions = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "transactions", params], queryFn: () => financeService.transactions(params) });

export const useFinanceTransactionSummary = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "transactions", "summary", params],
    queryFn: () => financeService.transactionSummary(params),
  });

/**
 * Realtime-primary: the `finance.withdrawals` Pusher channel invalidates this on
 * every status change (see usePaymentRealtime). Polling stays only as a fallback
 * while a payout is mid-flight — slow when the socket is up (self-heal a missed
 * push), fast when it's down. The server still owns the terminal state.
 */
export const useFinanceWithdrawals = (params: ListParams) => {
  const connected = useEchoConnected();
  return useQuery({
    queryKey: ["finance", "withdrawals", params],
    queryFn: () => financeService.withdrawals(params),
    refetchInterval: (query) => {
      const inFlight = query.state.data?.rows.some((w) => w.status === "PROCESSING");
      if (!inFlight) return false;
      return connected ? 30_000 : 5_000;
    },
  });
};

export const useApproveWithdrawal = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method, proof }: { id: number; method?: "manual" | "monetapay"; proof?: File }) =>
      financeService.approve(id, { method, proof }),
    onSuccess: (_, { method }) => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success(method === "manual" ? "Penarikan disetujui" : "Penarikan diproses ke Monetapay");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.approveWithdrawalFailed"));
    },
  });
};

/** Kita's own withdrawable balance — platform profit, gates "Penarikan Internal". */
export const usePlatformBalance = () =>
  useQuery({ queryKey: ["finance", "platform-balance"], queryFn: financeService.platformBalance });

export const useCreateInternalWithdrawal = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInternalWithdrawalPayload) => financeService.createInternalWithdrawal(payload),
    onSuccess: () => {
      // Refreshes both the internal withdrawals list and the platform-balance figure.
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success(t("toast.internalWithdrawalCreated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.internalWithdrawalFailed"));
    },
  });
};

export const useRejectWithdrawal = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => financeService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success(t("toast.withdrawalRejected"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.rejectWithdrawalFailed"));
    },
  });
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const useChannelFees = () =>
  useQuery({ queryKey: ["finance", "channels"], queryFn: financeService.channels });

/** Mirrors useServicesMeta: lets the page know it is a viewer before anyone types. */
export const useChannelMeta = () =>
  useQuery({ queryKey: ["finance", "channels", "meta"], queryFn: financeService.channelMeta });

export const useUpdateChannelFee = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        fee_flat?: number;
        fee_percent?: number;
        gateway_fee_flat?: number;
        gateway_fee_percent?: number;
        tax_percent?: number;
        is_active?: boolean;
      };
    }) => financeService.updateChannel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "channels"] });
      toast.success(t("toast.channelFeesSaved"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.channelFeesFailed"));
    },
  });
};

// ── Services, invoices, subscriptions & incidents ────────────────────────────

export const useFinanceServices = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "services", params], queryFn: () => financeService.services(params) });

/** Is the catalogue Hub-managed? Drives the read-only view of the services page. */
export const useServicesMeta = () =>
  useQuery({ queryKey: ["finance", "services", "meta"], queryFn: financeService.servicesMeta });

export const useCreateService = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => financeService.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success(t("toast.serviceCreated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.serviceCreateFailed"));
    },
  });
};

export const useUpdateService = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServicePayload> }) =>
      financeService.updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success(t("toast.serviceUpdated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.serviceUpdateFailed"));
    },
  });
};

export const useDeleteService = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "services"] });
      toast.success(t("toast.serviceDeleted"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.serviceDeleteFailed"));
    },
  });
};

export const useServiceInvoices = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "service-invoices", params],
    queryFn: () => financeService.serviceInvoices(params),
  });

export const useConfirmServiceInvoice = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.confirmServiceInvoice(id),
    onSuccess: () => {
      // Confirming also creates a subscription, so the whole namespace refreshes.
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success(t("toast.invoiceConfirmed"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.invoiceConfirmFailed"));
    },
  });
};

export const useRejectServiceInvoice = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      financeService.rejectServiceInvoice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "service-invoices"] });
      toast.success(t("toast.invoiceRejected"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.invoiceRejectFailed"));
    },
  });
};

export const useServiceSubscriptions = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "service-subscriptions", params],
    queryFn: () => financeService.serviceSubscriptions(params),
  });

export const useCancelSubscription = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "service-subscriptions"] });
      toast.success(t("toast.subscriptionCancelled"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.subscriptionCancelFailed"));
    },
  });
};

export const useIncidents = (params: ListParams) =>
  useQuery({ queryKey: ["finance", "incidents", params], queryFn: () => financeService.incidents(params) });

export const useCreateIncident = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncidentPayload) => financeService.createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success(t("toast.incidentCreated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.incidentCreateFailed"));
    },
  });
};

export const useUpdateIncident = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<IncidentPayload> }) =>
      financeService.updateIncident(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success(t("toast.incidentUpdated"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.incidentUpdateFailed"));
    },
  });
};

export const useDeleteIncident = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "incidents"] });
      toast.success(t("toast.incidentDeleted"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.incidentDeleteFailed"));
    },
  });
};

// ── Installation: schedule, checklist, credentials ──────────────────────────

export const useFinanceSubscription = (id: number) =>
  useQuery({ queryKey: ["finance", "subscription", id], queryFn: () => financeService.subscription(id) });

export const useFinanceInvoice = (id: number) =>
  useQuery({ queryKey: ["finance", "service-invoice", id], queryFn: () => financeService.serviceInvoice(id) });

/**
 * Keyed on the access path, not the installation id: before the first save the
 * endpoint returns null, so there is no id to key on.
 */
export const useFinanceInstallation = (scope: InstallationScope) =>
  useQuery({
    queryKey: ["finance", "installation", scope.by, scope.id],
    queryFn: () => financeService.installation(scope),
    enabled: Boolean(scope.id),
  });

/**
 * Every installation mutation invalidates the whole `["finance","installation"]`
 * prefix. The same row is reachable by two ids, so a change made from the
 * invoice page must refresh the subscription page's copy and vice versa —
 * TanStack matches by prefix, so both entries refresh with no bookkeeping.
 */
/**
 * Keys rather than sentences: the toast is written when it fires, not when the
 * module loads, so it follows the panel's language.
 */
const useInstallationMutation = <TVars,>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  successKey: string,
  errorKey: string,
) => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "installation"] });
      toast.success(t(successKey));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t(errorKey));
    },
  });
};

/** Scope is still needed here — it decides which URL the PUT goes to. */
export const useUpsertInstallation = (scope: InstallationScope) =>
  useInstallationMutation(
    (payload: InstallationPayload) => financeService.upsertInstallation(scope, payload),
    "toast.installScheduleSaved",
    "toast.installScheduleFailed",
  );

export const useCreateStep = (installationId: number | undefined) =>
  useInstallationMutation(
    (payload: InstallationStepPayload) => financeService.createStep(installationId as number, payload),
    "toast.stepCreated",
    "toast.stepCreateFailed",
  );

export const useUpdateStep = () =>
  useInstallationMutation(
    ({ id, payload }: { id: number; payload: Partial<InstallationStepPayload> }) =>
      financeService.updateStep(id, payload),
    "toast.stepUpdated",
    "toast.stepUpdateFailed",
  );

export const useSetStepCompletion = () =>
  useInstallationMutation(
    ({ id, completed }: { id: number; completed: boolean }) => financeService.setStepCompletion(id, completed),
    "toast.stepStatusUpdated",
    "toast.stepStatusFailed",
  );

export const useDeleteStep = () =>
  useInstallationMutation(
    (id: number) => financeService.deleteStep(id),
    "toast.stepDeleted",
    "toast.stepDeleteFailed",
  );

export const useCreateDetailItem = (installationId: number | undefined) =>
  useInstallationMutation(
    (payload: InstallationDetailPayload) => financeService.createDetailItem(installationId as number, payload),
    "toast.detailCreated",
    "toast.detailCreateFailed",
  );

export const useUpdateDetailItem = () =>
  useInstallationMutation(
    ({ id, payload }: { id: number; payload: Partial<InstallationDetailPayload> }) =>
      financeService.updateDetailItem(id, payload),
    "toast.detailUpdated",
    "toast.detailUpdateFailed",
  );

export const useDeleteDetailItem = () =>
  useInstallationMutation(
    (id: number) => financeService.deleteDetailItem(id),
    "toast.detailDeleted",
    "toast.detailDeleteFailed",
  );

/** A mutation, never a query — see the merchant twin for why. */
export const useRevealFinanceDetail = () => {
  const { t } = useTranslation("common");

  return useMutation({
    mutationFn: (id: number) => financeService.revealDetail(id),
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.revealFailed"));
    },
  });
};

// ── Notifications ───────────────────────────────────────────────────────────

export const useNotifications = (params: ListParams) =>
  useQuery({
    queryKey: ["finance", "notifications", params],
    queryFn: () => financeService.notifications(params),
  });

/**
 * Drives the navbar bell badge. Realtime-primary: the `user.{id}.notifications`
 * Pusher channel invalidates it the moment a notification lands. The interval is
 * now just a slow self-heal (2 min) when the socket is up, tightening to 20s only
 * if it drops — the badge is the one number that must feel live.
 */
export const useNotificationUnreadCount = () => {
  const connected = useEchoConnected();
  return useQuery({
    queryKey: ["finance", "notifications", "unread-count"],
    queryFn: financeService.notificationsUnreadCount,
    refetchInterval: connected ? 120_000 : 20_000,
  });
};

export const useMarkNotificationRead = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "notifications"] }),
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.notificationMarkFailed"));
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => financeService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "notifications"] });
      toast.success(t("toast.allNotificationsRead"));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? t("toast.notificationMarkFailed"));
    },
  });
};
