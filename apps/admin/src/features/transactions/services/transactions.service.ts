import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  ActivityLogEntry,
  RecapPeriod,
  StatusCounts,
  Transaction,
  TransactionListParams,
  TransactionRecap,
  TransactionStatus,
} from "../types/transaction.type";

const BASE = `${API_VERSION}/transactions`;

/**
 * The API's transaction status enum, mapped onto this feature's vocabulary.
 *
 * `PAID` collapses into `pending`: the customer has paid but the supplier has
 * not started, which is exactly what the Pending pill means to an operator.
 * `EXPIRED` and `FAILED_PROVIDER` both read as `failed` — the distinction
 * (never paid vs paid-then-failed) is carried by the payment status column.
 */
const INVOICE_STATUS: Record<string, TransactionStatus> = {
  PENDING: "pending",
  PAID: "pending",
  PROCESSING: "processing",
  COMPLETED: "success",
  FAILED_PROVIDER: "failed",
  EXPIRED: "failed",
  REFUNDED: "partial_refund",
};

/** `payments.status` is stored as a numeric string — see App\Enums\PaymentStatus. */
const PAYMENT_STATUS: Record<string, TransactionStatus> = {
  "1": "pending",
  "2": "failed",
  "3": "success",
  "4": "partial_refund",
};

/** The reverse direction, for writes. */
const TO_API_STATUS: Partial<Record<TransactionStatus, string>> = {
  pending: "PENDING",
  processing: "PROCESSING",
  success: "COMPLETED",
  failed: "FAILED_PROVIDER",
  partial_refund: "REFUNDED",
};

/**
 * Columns the API will sort by. `user`, `product` and `target_ref` live across
 * a join and are not in the backend's whitelist, so they are dropped rather
 * than silently sorting by something else.
 */
const SORTABLE: Record<string, string> = {
  invoice_no: "invoice_number",
  cost: "amount_total",
  status: "status",
  time: "created_at",
};

interface TransactionApiRow {
  id: number;
  invoice_number: string;
  user_id: number | null;
  guest_contact: string | null;
  target_uid: string | null;
  target_server: string | null;
  amount_fee: number;
  amount_total: number;
  margin: number;
  status: string;
  sn: string | null;
  proof_url: string | null;
  user?: { id: number; name: string; phone: string; avatar_url: string | null } | null;
  product?: { id: number; name: string; category?: { id: number; name: string } | null } | null;
  payment?: { status: string } | null;
  payment_channel?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

interface RecapApiShape {
  generated_at: string;
  breakdown?: { label: string; count: number; revenue: number }[];
  total_count?: number;
  total_revenue?: number;
}

const toTransaction = (row: TransactionApiRow): Transaction => {
  const invoiceStatus = INVOICE_STATUS[row.status] ?? "pending";
  const isTerminal = invoiceStatus === "success" || invoiceStatus === "failed" || invoiceStatus === "partial_refund";

  return {
    id: toRowId(row.id),
    invoice_no: row.invoice_number,
    payment_status: PAYMENT_STATUS[row.payment?.status ?? ""] ?? "pending",
    invoice_status: invoiceStatus,
    customer: {
      user_id: row.user_id,
      // Guests have no user row; their contact lives on the transaction.
      name: row.user?.name ?? "Guest",
      phone: row.user?.phone ?? row.guest_contact ?? "",
      avatar_url: row.user?.avatar_url ?? undefined,
    },
    game: {
      id: toRowId(row.product?.category?.id ?? 0),
      name: row.product?.category?.name ?? "",
    },
    product: { id: toRowId(row.product?.id ?? 0), name: row.product?.name ?? "" },
    // `cost` is the customer's total, not the upstream cost — the column
    // header reads "Cost" but the reference's figures are the amount billed.
    cost: row.amount_total,
    profit: row.margin,
    admin_fee: row.amount_fee,
    target_ref: [row.target_uid, row.target_server].filter(Boolean).join(" / ") || undefined,
    payment_method: row.payment_channel?.name ?? "",
    serial_number: row.sn ?? undefined,
    proof_url: row.proof_url ?? undefined,
    created_at: row.created_at,
    // The API has no resolved_at column; once a transaction reaches a terminal
    // state its last write *is* the resolution, so updated_at stands in.
    resolved_at: isTerminal ? row.updated_at : undefined,
    elapsed_seconds: isTerminal
      ? Math.max(0, Math.round((Date.parse(row.updated_at) - Date.parse(row.created_at)) / 1000))
      : undefined,
    activity_log: [],
    updated_at: row.updated_at,
  };
};

const toListParams = (params: TransactionListParams) => ({
  ...(params.search && { search: params.search }),
  ...(params.userId && { user_id: params.userId }),
  ...(params.productId && { product_id: params.productId }),
  ...(params.paymentMethod && { payment_channel_id: params.paymentMethod }),
  ...(params.invoiceStatus && { status: TO_API_STATUS[params.invoiceStatus] }),
  ...(params.startDate && { start_date: params.startDate }),
  ...(params.endDate && { end_date: params.endDate }),
  ...(params.page && { page: params.page }),
  ...(params.per_page && { per_page: params.per_page }),
  ...(params.sortBy && SORTABLE[params.sortBy] ? { sort_by: SORTABLE[params.sortBy] } : {}),
  ...(params.sortDir && { sort_dir: params.sortDir }),
});

export const transactionsService = {
  list: async (params: TransactionListParams): Promise<PaginatedResponse<Transaction>> => {
    const response: ApiResponse<PaginatedResponse<TransactionApiRow>> = await api.get(BASE, {
      params: toListParams(params),
    });
    return unwrapPaginated(response, toTransaction);
  },

  /**
   * `ref` is whatever the route carries, and the edit route is keyed on the
   * invoice number — the identifier an operator can actually read off a
   * receipt. The API binds `{transaction}` to the numeric id, so a non-numeric
   * ref is resolved through a search instead of 404ing.
   */
  getById: async (ref: string): Promise<Transaction> => {
    if (/^\d+$/.test(ref)) {
      const response: ApiResponse<TransactionApiRow> = await api.get(`${BASE}/${ref}`);
      return toTransaction(response.data);
    }

    const response: ApiResponse<PaginatedResponse<TransactionApiRow>> = await api.get(BASE, {
      params: { search: ref, per_page: 1 },
    });

    const found = response.data.data[0];
    if (!found) throw new Error(`No transaction found for: ${ref}`);
    return toTransaction(found);
  },

  /**
   * Scoped by `activity_logs.transaction_id`. The admin's row id is the
   * transaction's own id, so an invoice-number ref is resolved first.
   */
  getActivityLog: async (id: string): Promise<ActivityLogEntry[]> => {
    const transactionId = /^\d+$/.test(id) ? id : (await transactionsService.getById(id)).id;

    const response: ApiResponse<
      PaginatedResponse<{ id: number; actor: string; message: string; created_at: string }>
    > = await api.get(`${API_VERSION}/activity-logs`, {
      params: { transaction_id: transactionId, per_page: 50 },
    });

    return response.data.data.map((row) => ({
      id: toRowId(row.id),
      actor: row.actor === "System" ? "system" : { name: row.actor },
      // The table stores one human-readable sentence; there is no separate
      // short label to split off, so the sentence is the description and the
      // action column carries a constant.
      action: "Activity",
      description: row.message,
      created_at: row.created_at,
    }));
  },

  getStatusCounts: async (): Promise<StatusCounts> => {
    const response: ApiResponse<{ pending: number; processing: number; failed_provider: number }> = await api.get(
      `${BASE}/status-counts`,
    );
    return {
      pending: response.data.pending,
      processing: response.data.processing,
      failed: response.data.failed_provider,
    };
  },

  edit: async (id: string, formData: FormData): Promise<Transaction> => {
    // The API marks amount_base and status required on update, so the edit
    // form's three fields have to be merged onto the current row first.
    const current = await transactionsService.getById(id);
    const invoiceStatus = (formData.get("invoiceStatus") as TransactionStatus | null) ?? current.invoice_status;
    const serialNumber = formData.get("serialNumber");
    const proof = formData.get("proof");

    // A proof upload goes through manual-review — the only endpoint that
    // accepts a file.
    if (proof instanceof File) {
      const reviewForm = new FormData();
      reviewForm.append("proof", proof);
      reviewForm.append("status", TO_API_STATUS[invoiceStatus] ?? "PENDING");
      await api.post(`${BASE}/${id}/manual-review`, reviewForm);
    }

    const response: ApiResponse<TransactionApiRow> = await api.put(`${BASE}/${id}`, {
      amount_base: current.cost - (current.admin_fee ?? 0),
      amount_fee: current.admin_fee ?? 0,
      amount_total: current.cost,
      status: TO_API_STATUS[invoiceStatus] ?? "PENDING",
      ...(serialNumber !== null && { sn: String(serialNumber) }),
    });

    return toTransaction(response.data);
  },

  refund: async (id: string, reason: string): Promise<void> => {
    if (!reason.trim()) throw new Error("A refund reason is required");
    await api.post(`${BASE}/${id}/refund`, { reason });
  },

  resendCallback: async (id: string): Promise<void> => {
    await api.post(`${BASE}/${id}/resend-callback`);
  },

  retryInvoice: async (id: string): Promise<void> => {
    await api.post(`${BASE}/${id}/retry`);
  },

  /** Re-sends the transaction receipt to the customer (product_requirements.md §4.3). */
  resendReceipt: async (id: string): Promise<void> => {
    await api.post(`${BASE}/${id}/resend-receipt`);
  },

  /**
   * Downloads the current filtered set (product_requirements.md §4.3). Pagination
   * is dropped so the export covers every matching row, not just the page. The
   * axios interceptor unwraps `response.data`, so the blob is returned directly.
   */
  exportTransactions: async (params: TransactionListParams, format: "csv" = "csv"): Promise<Blob> => {
    const { page: _page, per_page: _perPage, ...rest } = params;
    void _page;
    void _perPage;
    const blob: Blob = await api.get(`${BASE}/export`, {
      params: { ...toListParams(rest), format },
      responseType: "blob",
    });
    return blob;
  },

  /**
   * Daily/monthly recap with a per-group breakdown (product_requirements.md
   * §4.3). The API is assumed to return the aggregation already grouped; the
   * mapper just normalises the field names and derives the totals footer when
   * the backend omits it.
   */
  getRecap: async (period: RecapPeriod = "daily"): Promise<TransactionRecap> => {
    const response: ApiResponse<RecapApiShape> = await api.get(`${BASE}/recap`, { params: { period } });
    const data = response.data;
    const rows = (data.breakdown ?? []).map((row) => ({
      label: row.label,
      count: row.count,
      revenue: row.revenue,
    }));
    return {
      period,
      generated_at: data.generated_at,
      rows,
      totals: {
        count: data.total_count ?? rows.reduce((sum, row) => sum + row.count, 0),
        revenue: data.total_revenue ?? rows.reduce((sum, row) => sum + row.revenue, 0),
      },
    };
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
