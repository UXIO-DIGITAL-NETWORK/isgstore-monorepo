import { useMutation, useQuery } from "@tanstack/react-query";

import { refundService } from "@/features/refund/services/refund.service";
import type { PayoutDetailsPayload } from "@/features/refund/types/refund.type";

/**
 * The claim behind a one-time link. `enabled` keeps it from firing on the
 * lookup-only view, and `retry: false` matters: a 404 here means the token is
 * unknown or expired, which is a final answer, not a transient failure.
 */
export const useRefundClaim = (token: string | null) =>
  useQuery({
    queryKey: ["refund-claim", token],
    queryFn: async () => {
      const response = await refundService.claim(token as string);
      return response.data;
    },
    enabled: Boolean(token),
    retry: false,
  });

export const usePayoutBanks = () =>
  useQuery({
    queryKey: ["payout-banks"],
    queryFn: async () => {
      const response = await refundService.payoutBanks();
      return response.data ?? [];
    },
    // A static catalogue that changes with a backend release, not with data.
    staleTime: Infinity,
  });

export const useSubmitPayoutDetails = (token: string | null) =>
  useMutation({
    mutationFn: (payload: PayoutDetailsPayload) => refundService.submitPayoutDetails(token as string, payload),
  });

/**
 * Re-sends the claim link. The response is deliberately identical whether or
 * not anything matched, so there is nothing here to branch on — success means
 * "we have answered", not "we found your order".
 */
export const useResendClaimLink = () =>
  useMutation({
    mutationFn: ({ invoiceNumber, contact }: { invoiceNumber: string; contact: string }) =>
      refundService.resendClaimLink(invoiceNumber, contact),
  });
