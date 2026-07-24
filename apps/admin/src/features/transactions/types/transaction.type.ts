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
  payment_method: string;
  serial_number?: string;
  proof_url?: string;
  created_at: string;
  resolved_at?: string;
  /** Raw seconds between created_at and resolved_at — UI formats the duration badge. */
  elapsed_seconds?: number;
  /** PRD-provisional; shape not specified yet. */
  status_history?: unknown[];
  /** Audit trail shown by the Activity Log modal. */
  activity_log: ActivityLogEntry[];
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

/** Matches the three clickable status pills above the table. */
export interface StatusCounts {
  pending: number;
  partial_refund: number;
  partial_success: number;
}

/** Small typed option shape for the filter-bar selects. */
export interface SelectOption {
  value: string;
  label: string;
}
