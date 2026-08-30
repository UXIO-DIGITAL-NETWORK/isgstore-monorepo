import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { refundsService } from "../services/refunds.service";
import type { PayoutDetailsPayload, RefundListParams } from "../types/refund.type";

export const useRefundList = (params: RefundListParams) =>
  useQuery({
    queryKey: ["refunds", "list", params],
    queryFn: () => refundsService.list(params),
  });

export const useRefundStatusCounts = () =>
  useQuery({
    queryKey: ["refunds", "status-counts"],
    queryFn: refundsService.statusCounts,
  });

/**
 * `enabled` is the detail dialog's open state, and is load-bearing: the dialog
 * is mounted once per table row, so without it every visible row would fetch
 * its detail on mount.
 */
export const useRefundDetail = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["refunds", "detail", id],
    queryFn: () => refundsService.detail(id),
    enabled,
  });

/**
 * Every mutation below invalidates `["refunds"]` (list + counts + detail) and
 * `["transactions"]`, because completing a refund also flips the underlying
 * transaction to REFUNDED.
 */
const useRefundMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  successMessage: string,
  errorMessage: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(successMessage);
    },
    onError: () => {
      toast.error(errorMessage);
    },
  });
};

export const useSaveRefundPayoutDetails = () =>
  useRefundMutation(
    ({ id, payload }: { id: string; payload: PayoutDetailsPayload }) => refundsService.savePayoutDetails(id, payload),
    "Payout details saved",
    "Could not save the payout details",
  );

export const useProcessRefund = () =>
  useRefundMutation(
    (id: string) => refundsService.process(id),
    "Refund claimed — you are handling this one",
    // The usual cause is another admin already holding the row, which is
    // exactly what this state exists to prevent.
    "Could not claim this refund",
  );

export const useCompleteRefund = () =>
  useRefundMutation(
    ({ id, proof, note }: { id: string; proof?: File | null; note?: string }) =>
      refundsService.complete(id, { proof, note }),
    "Refund completed",
    "Could not complete this refund",
  );

export const useRejectRefund = () =>
  useRefundMutation(
    ({ id, reason }: { id: string; reason: string }) => refundsService.reject(id, reason),
    "Refund rejected",
    "Could not reject this refund",
  );
