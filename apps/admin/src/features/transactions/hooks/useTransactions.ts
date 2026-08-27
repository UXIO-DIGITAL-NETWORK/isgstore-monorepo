import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionsService } from "../services/transactions.service";
import { downloadBlob } from "../lib/downloadBlob";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { RecapPeriod, TransactionListParams } from "../types/transaction.type";

export const useTransactionList = (params: TransactionListParams) => {
  // Realtime (useTransactionsRealtime) is the primary refresh path. Poll only as
  // a safety net: a very slow self-heal while the socket is healthy, faster when
  // it has dropped. Avoids a constant background refetch on every admin tab.
  const connected = useEchoConnected();

  return useQuery({
    queryKey: ["transactions", "list", params],
    queryFn: () => transactionsService.list(params),
    refetchInterval: connected ? 120_000 : 30_000,
  });
};

export const useTransaction = (id: string) =>
  useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => transactionsService.getById(id),
  });

/**
 * Backs the read-only Transaction Detail dialog.
 *
 * `enabled` is the dialog's open state, and is load-bearing for the same
 * reason as the Activity Log dialog's: the dialog is mounted once per table
 * row, so without it every visible row would fetch its detail on mount.
 *
 * The key segment is `detail-full`, not `detail`: it is the same id but a
 * wider shape, and the two must not collide in the cache.
 */
export const useTransactionDetail = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["transactions", "detail-full", id],
    queryFn: () => transactionsService.getDetail(id),
    enabled,
  });

/**
 * `enabled` is the dialog's open state, and is load-bearing: the Activity Log
 * dialog is mounted once per table row, so without it every visible row would
 * fetch its log on mount.
 */
export const useTransactionActivityLog = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["transactions", "activity-log", id],
    queryFn: () => transactionsService.getActivityLog(id),
    enabled,
  });

export const useStatusCounts = () =>
  useQuery({
    queryKey: ["transactions", "status-counts"],
    queryFn: transactionsService.getStatusCounts,
  });

export const useEditTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => transactionsService.edit(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction updated");
    },
    onError: () => {
      toast.error("Failed to update transaction");
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted");
    },
    onError: () => {
      toast.error("Failed to delete transaction");
    },
  });
};

export const useRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => transactionsService.refund(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Refund initiated");
    },
    onError: () => {
      toast.error("Failed to initiate refund");
    },
  });
};

export const useResendCallback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.resendCallback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Callback resent");
    },
    onError: () => {
      toast.error("Failed to resend callback");
    },
  });
};

export const useRetryInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.retryInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Invoice retried");
    },
    onError: () => {
      toast.error("Failed to retry invoice");
    },
  });
};

export const useResendReceipt = () =>
  useMutation({
    mutationFn: (id: string) => transactionsService.resendReceipt(id),
    onSuccess: () => {
      toast.success("Receipt resent");
    },
    onError: () => {
      toast.error("Failed to resend receipt");
    },
  });

/**
 * `enabled` is the Recap dialog's open state — the query only runs while the
 * dialog is mounted-and-open, and re-runs when the operator flips the period.
 */
export const useRecap = (period: RecapPeriod, enabled: boolean) =>
  useQuery({
    queryKey: ["transactions", "recap", period],
    queryFn: () => transactionsService.getRecap(period),
    enabled,
  });

export const useExportTransactions = () =>
  useMutation({
    mutationFn: (params: TransactionListParams) => transactionsService.exportTransactions(params),
    onSuccess: (blob) => {
      downloadBlob(blob, "transactions.csv");
      toast.success("Export ready");
    },
    onError: () => {
      toast.error("Failed to export transactions");
    },
  });
