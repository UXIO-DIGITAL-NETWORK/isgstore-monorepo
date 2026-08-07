import { useQuery } from "@tanstack/react-query";

import { feedbackService } from "../services/feedback.service";
import type { FeedbackListParams } from "../types/feedback.type";

/** Paginated customer feedback (ratings); re-fetches when the page changes. */
export const useFeedback = (params: FeedbackListParams) =>
  useQuery({
    queryKey: ["feedback", "list", params],
    queryFn: () => feedbackService.list(params),
  });
