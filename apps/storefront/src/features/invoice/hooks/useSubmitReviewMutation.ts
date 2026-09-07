import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService, type SubmitRatingPayload } from "@/features/invoice/services/invoice.service";
import type { ApiResponse } from "@/types/api.type";

/**
 * Post-purchase review.
 *
 * On success the game-review lists are invalidated by prefix: the modal knows
 * the invoice number but not the game slug, and TanStack Query matches keys
 * prefix-first, so `["checkout", "reviews"]` reaches `["checkout", "reviews",
 * slug]` for every slug. Without it a customer submits a review and does not
 * see it on the game page, which reads as a failed submit.
 */
export const useSubmitReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitRatingPayload): Promise<ApiResponse<null>> =>
      invoiceService.submitRating(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["checkout", "reviews"] });
    },
  });
};
