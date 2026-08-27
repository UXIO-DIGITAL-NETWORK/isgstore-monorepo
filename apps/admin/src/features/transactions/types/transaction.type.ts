/**
 * Transaction entity per product_requirements.md §4.3/§6 (revised 2026-07-10
 * against the Automatic Transaction History reference). Provisional until
 * the real API contract lands.
 */
export type TransactionStatus = "pending" | "processing" | "success" | "failed" | "partial_refund" | "partial_success";

export interface TransactionCustomer {
  user_id: number | null;
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
}

export interface TransactionGameRef {
  id: string;
  name: string;
}

export interface TransactionProductRef {
  id: string;
  name: string;
}

/** Human operator who performed an entry. No avatar_url — fixtures carry no
 *  images and AvatarFallback covers it (same as TransactionCustomer today). */
export interface ActivityLogActor {
  name: string;
  phone?: string;
}

/**
 * One audit-trail row for the Activity Log modal (product_requirements.md
 * §4.3/§6). `actor` is the literal "system" for automated events. `action` is
 * a short event label ("Status Changed"); `description` is that event's
 * specific detail ("Status changed from Processing to Success.").
 */
export interface ActivityLogEntry {
  id: string;
  actor: ActivityLogActor | "system";
  action: string;
  description: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  /** Sub-code shown under the invoice number in the reference. */
  invoice_ref?: string;
  /** Confirmed as a separate field from invoice_status. */
  payment_status: TransactionStatus;
  invoice_status: TransactionStatus;
  customer: TransactionCustomer;
  game: TransactionGameRef;
  product: TransactionProductRef;
  cost: number;
  profit?: number;
  admin_fee?: number;
  /** Provider/destination account reference. */
  target_ref?: string;
  /** In-game username resolved by the "Cek Username" check at checkout. */
  nickname?: string;
  payment_method: string;
  serial_number?: string;
  proof_url?: string;
  created_at: string;
  resolved_at?: string;
  /** Raw seconds between created_at and resolved_at — UI formats the duration badge. */
  elapsed_seconds?: number;
  /** Audit trail shown by the Activity Log modal. */
  activity_log: ActivityLogEntry[];
  updated_at: string;
}

/** The gateway half of a detail read. Every field is absent until the customer pays. */
export interface TransactionDetailPayment {
  reference_id?: string;
  pg_transaction_id?: string;
  gross_amount?: number;
  paid_at?: string;
}

export interface TransactionDetailSupplier {
  name?: string;
  trx_id?: string;
  /** The provider's own vocabulary, not a TransactionStatus — render it as text. */
  status?: string;
}

/**
 * What `GET /v1/transactions/{id}` guarantees, for the read-only detail
 * dialog.
 *
 * Deliberately NOT a widening of `Transaction`: that type is the DataTable row
 * and the fixture shape, so adding these as required fields would force every
 * fixture to invent gateway references, and adding them as optional would give
 * the dialog no type-level guarantee the data was ever requested — the exact
 * mechanism that left the Game column blank.
 *
 * `total_price` is excluded on purpose: the API writes it only for
 * admin-created rows, so it is 0 on every customer order.
 * `resolved_at`/`elapsed_seconds` are excluded too — both are derived from
 * `updated_at`, so a later admin edit silently rewrites them. The dialog shows
 * `updated_at` honestly as "Last Update" instead.
 */
export interface TransactionDetail {
  id: string;
  invoice_no: string;
  invoice_status: TransactionStatus;
  payment_status: TransactionStatus;
  is_manual: boolean;
  customer: TransactionCustomer;
  game: TransactionGameRef;
  product: TransactionProductRef;
  target_ref?: string;
  target_uid?: string;
  target_server?: string;
  nickname?: string;
  serial_number?: string;
  proof_url?: string;
  /** Already net of `discount_amount` — the discount is informational only. */
  amount_base: number;
  discount_amount: number;
  amount_fee: number;
  /** Equal to `amount_fee` on every modern row; only legacy markup rows differ. */
  channel_fee: number;
  amount_total: number;
  margin: number;
  payment_method: string;
  payment: TransactionDetailPayment;
  supplier: TransactionDetailSupplier;
  created_at: string;
  updated_at: string;
}

/** The 10 filter-bar fields from product_requirements.md §4.3, plus pagination + sorting. */
export interface TransactionListParams {
  search?: string;
  userId?: string;
  categoryId?: string;
  productId?: string;
  invoiceStatus?: TransactionStatus;
  paymentStatus?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  invoiceFrom?: string;
  paymentMethod?: string;
  page?: number;
  per_page?: number;
  /** Column id from the table (e.g. "invoice_no", "cost", "time") — see SORTERS in transactions.service.ts. */
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * The three clickable status pills above the table.
 *
 * These were originally `pending / partial_refund / partial_success`, but
 * neither partial state exists in the backend's transaction status enum —
 * there is no data behind them and never was. The pills now surface the three
 * statuses an operator actually acts on, which is what the API's
 * `/transactions/status-counts` reports.
 */
export interface StatusCounts {
  pending: number;
  processing: number;
  failed: number;
}

/** Small typed option shape for the filter-bar selects. */
export interface SelectOption {
  value: string;
  label: string;
}

/** Recap report granularity (product_requirements.md §4.3). */
export type RecapPeriod = "daily" | "monthly";

/** One breakdown line of the recap — per game/product/payment channel. */
export interface RecapRow {
  label: string;
  count: number;
  revenue: number;
}

/** Downloadable daily/monthly transaction recap with a totals footer. */
export interface TransactionRecap {
  period: RecapPeriod;
  generated_at: string;
  rows: RecapRow[];
  totals: { count: number; revenue: number };
}
