/**
 * Refund entity — the money the platform owes back.
 *
 * Two kinds, decided by the backend when the refund is opened and never
 * switchable: a registered member is credited to their wallet immediately
 * (`balance`, born `COMPLETED`), while a guest has to be transferred by hand
 * (`manual_transfer`, worked through this queue). `legacy_gateway` rows are
 * backfilled history from the retired automatic gateway refund.
 */
export type RefundMethod = "balance" | "manual_transfer" | "legacy_gateway";

/**
 * WAITING_DETAILS → PENDING → PROCESSING → COMPLETED | REJECTED
 *
 * PROCESSING means a named admin has claimed the row. It is the lock that
 * stops two operators making the same bank transfer, so it is a real state,
 * not decoration.
 */
export type RefundStatus =
  | "WAITING_DETAILS"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED";

export interface RefundTransactionRef {
  id: number;
  invoice_number: string | null;
  product: string | null;
  created_at: string | null;
}

export interface RefundCustomer {
  user_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_guest: boolean;
}

export interface RefundPayout {
  bank_code: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  account_phone: string | null;
  submitted_at: string | null;
  /** Who supplied the account — the difference matters if a transfer is disputed. */
  submitted_by: "customer" | "admin" | null;
}

export interface Refund {
  /** String because DataTable is keyed on `{ id: string }`. */
  id: string;
  refund_number: string;
  method: RefundMethod;
  status: RefundStatus;
  amount: number;
  transaction: RefundTransactionRef;
  customer: RefundCustomer;
  payout: RefundPayout | null;
  /** Null means the customer was never reachable — the row needs chasing by hand. */
  claim_notified_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  proof_url: string | null;
  admin_note: string | null;
  reject_reason: string | null;
  refunded_at: string | null;
  /** Null on a completed refund means the bookkeeping reversal did not go through. */
  settlement_reversed_at: string | null;
  created_at: string | null;
}

export interface RefundListParams {
  status?: RefundStatus;
  method?: RefundMethod;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

/** Counts per status, keyed by the API's own enum values. */
export type RefundStatusCounts = Partial<Record<RefundStatus, number>>;

export interface PayoutDetailsPayload {
  bank_code: string;
  account_number?: string;
  account_name: string;
  account_phone?: string;
}
