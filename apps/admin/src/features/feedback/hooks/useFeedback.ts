import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { feedbackService } from "../services/feedback.service";
import type { FeedbackListParams } from "../types/feedback.type";

const KEY = "feedback";

/** Paginated customer feedback (ratings); re-fetches when the page changes. */
export const useFeedback = (params: FeedbackListParams) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => feedbackService.list(params),
  });

/** Moderation: removes a review outright. There is no edit counterpart — see
 *  the note on `feedbackService`. */
export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feedbackService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Failed to delete review"),
  });
};
