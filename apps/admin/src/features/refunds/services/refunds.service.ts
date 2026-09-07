import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  PayoutDetailsPayload,
  Refund,
  RefundClaimedAccount,
  RefundListParams,
  RefundStatusCounts,
} from "../types/refund.type";

const BASE = `${API_VERSION}/refunds`;

/**
 * The API row. Status and method come back as the backend's own enum values
 * and are NOT remapped onto a local vocabulary — unlike transactions, where
 * the historical `partial_refund` naming forced a translation layer. One
 * vocabulary here means a filter value can be forwarded straight to the query
 * string.
 */
interface RefundApiRow {
  id: number;
  refund_number: string;
  method: Refund["method"];
  status: Refund["status"];
  amount: number;
  transaction: Refund["transaction"];
  customer: Refund["customer"];
  payout: Refund["payout"];
  claim_notified_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  proof_url: string | null;
  admin_note: string | null;
  reject_reason: string | null;
  refunded_at: string | null;
  settlement_reversed_at: string | null;
  created_at: string | null;
  claimed_account: RefundClaimedAccount | null;
  verify_due_at: string | null;
  is_overdue: boolean;
  claim_rejected_count: number;
}

const toRefund = (row: RefundApiRow): Refund => ({
  ...row,
  id: toRowId(row.id),
});

const toQuery = (params: RefundListParams) => ({
  ...(params.status && { status: params.status }),
  ...(params.method && { method: params.method }),
  ...(params.unclaimed && { unclaimed: 1 }),
  ...(params.overdue && { overdue: 1 }),
  ...(params.search && { search: params.search }),
  ...(params.dateFrom && { date_from: params.dateFrom }),
  ...(params.dateTo && { date_to: params.dateTo }),
  ...(params.page && { page: params.page }),
  ...(params.per_page && { per_page: params.per_page }),
});

export const refundsService = {
  list: async (params: RefundListParams = {}): Promise<PaginatedResponse<Refund>> => {
    const response = await api.get(BASE, { params: toQuery(params) });

    return unwrapPaginated<RefundApiRow, Refund>(response, toRefund);
  },

  statusCounts: async (): Promise<RefundStatusCounts> => {
    const response: ApiResponse<RefundStatusCounts> = await api.get(`${BASE}/status-counts`);

    return response.data ?? {};
  },

  detail: async (id: string): Promise<Refund> => {
    const response: ApiResponse<RefundApiRow> = await api.get(`${BASE}/${id}`);

    return toRefund(response.data);
  },

  /** An admin filling in the payout account on the customer's behalf. */
  savePayoutDetails: async (id: string, payload: PayoutDetailsPayload): Promise<Refund> => {
    const response: ApiResponse<RefundApiRow> = await api.post(`${BASE}/${id}/payout-details`, payload);

    return toRefund(response.data);
  },

  /** Claim the row before transferring, so a second admin cannot pay it too. */
  process: async (id: string): Promise<Refund> => {
    const response: ApiResponse<RefundApiRow> = await api.post(`${BASE}/${id}/process`);

    return toRefund(response.data);
  },

  /**
   * Confirm the transfer is done. Multipart because the proof is a file, and
   * it is uploaded exactly as submitted — proof is evidence, so unlike every
   * other image in this app it is never re-encoded to WebP first.
   */
  complete: async (id: string, input: { proof?: File | null; note?: string }): Promise<Refund> => {
    const form = new FormData();
    if (input.proof) form.append("proof", input.proof);
    if (input.note) form.append("note", input.note);

    const response: ApiResponse<RefundApiRow> = await api.post(`${BASE}/${id}/complete`, form);

    return toRefund(response.data);
  },

  reject: async (id: string, reason: string): Promise<Refund> => {
    if (!reason.trim()) throw new Error("A rejection reason is required");

    const response: ApiResponse<RefundApiRow> = await api.post(`${BASE}/${id}/reject`, { reason });

    return toRefund(response.data);
  },

  /**
   * Refuse the *account* that claimed the refund, not the refund itself.
   *
   * The money never left, so the buyer is still owed it: the row goes back to
   * awaiting an account and a fresh claim link is sent to the contact on the
   * order. Use `reject` only when the refund itself is not owed.
   */
  rejectClaim: async (id: string, reason: string): Promise<Refund> => {
    if (!reason.trim()) throw new Error("A rejection reason is required");

    const response: ApiResponse<RefundApiRow> = await api.post(`${BASE}/${id}/reject-claim`, { reason });

    return toRefund(response.data);
  },
};
