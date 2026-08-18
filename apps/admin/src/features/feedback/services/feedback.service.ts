import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { Feedback, FeedbackListParams } from "../types/feedback.type";

/**
 * Data layer for customer feedback (`/v1/ratings`).
 *
 * Read and delete only. Reviews are written by customers on the storefront and
 * are never authored or edited here — the API keeps `ratings` strictly
 * purchase-linked, so admin-written text in this table would read as a verified
 * purchase review. Removing spam or abuse is the one moderation action needed.
 */
const BASE = `${API_VERSION}/ratings`;

/** The API row (`RatingResource`) — reviewer is a member (`user`) or guest (`guest_name`). */
interface RatingApiRow {
  id: number;
  transaction_id: number | null;
  user_id: number | null;
  guest_name: string | null;
  rating: number;
  comment: string | null;
  user: { id: number; name?: string | null; username?: string | null } | null;
  transaction: { invoice_number?: string | null; product?: { name?: string | null } | null } | null;
  created_at: string;
}

const toFeedback = (row: RatingApiRow): Feedback => ({
  id: toRowId(row.id),
  rating: row.rating,
  comment: row.comment,
  reviewer: row.user?.name || row.user?.username || row.guest_name || "—",
  isGuest: !row.user_id,
  product: row.transaction?.product?.name ?? null,
  invoiceNumber: row.transaction?.invoice_number ?? null,
  createdAt: row.created_at,
});

export const feedbackService = {
  list: async (params: FeedbackListParams = {}): Promise<PaginatedResponse<Feedback>> => {
    const response: ApiResponse<PaginatedResponse<RatingApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toFeedback);
  },

  /** Permanently removes one review. The API logs it to `activity_logs`. */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
