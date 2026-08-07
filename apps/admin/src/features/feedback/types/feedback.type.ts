/**
 * Feedback — customer ratings served by `GET /v1/ratings` (`RatingResource`).
 * One row per review; the reviewer is a member (has `user`) or a guest (has a
 * generated `guest_name` and null `user_id`).
 */
export interface Feedback {
  /** Normalized to a string for `DataTable`/column keys via `toRowId`. */
  id: string;
  rating: number;
  comment: string | null;
  reviewer: string;
  isGuest: boolean;
  product: string | null;
  invoiceNumber: string | null;
  createdAt: string;
}

export interface FeedbackListParams {
  page?: number;
  per_page?: number;
}
