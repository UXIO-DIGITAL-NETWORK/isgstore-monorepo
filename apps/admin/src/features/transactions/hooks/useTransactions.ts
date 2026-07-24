import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionsService } from "../services/transactions.service";
import type { TransactionListParams } from "../types/transaction.type";

export const useTransactionList = (params: TransactionListParams) =>
  useQuery({
    queryKey: ["transactions", "list", params],
    queryFn: () => transactionsService.list(params),
  });

export const useTransaction = (id: string) =>
  useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => transactionsService.getById(id),
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
