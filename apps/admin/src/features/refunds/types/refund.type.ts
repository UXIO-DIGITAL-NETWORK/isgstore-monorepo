/**
 * Refund entity — the money the platform owes back.
 *
 * The method is decided by the backend when the refund is opened and is never
 * switchable afterwards:
 *
 *  - `balance` — the buyer was signed in, so the wallet was credited in the
 *    same transaction that opened the refund. Born `COMPLETED`, zero actions.
 *  - `balance_claim` — the buyer checked out as a guest. They have to create
 *    (or sign in to) an account before the money can be credited, and an admin
 *    verifies that account before it is. This is the current scheme.
 *  - `manual_transfer` — the retired guest scheme: an admin transfers to a
 *    bank account by hand. No new rows are opened this way; the ones still
 *    open are worked to completion through the same queue.
 *  - `legacy_gateway` — backfilled history from the retired automatic gateway
 *    refund.
 */
export type RefundMethod = "balance" | "balance_claim" | "manual_transfer" | "legacy_gateway";

/**
 * WAITING_ACCOUNT → PENDING → PROCESSING → COMPLETED | REJECTED
 *
 * WAITING_ACCOUNT is where a `balance_claim` refund is born: the money is
 * owed, but the guest has not created an account to receive it yet. It leaves
 * that state only when someone claims it with an account whose contact matches
 * the order. WAITING_DETAILS is its `manual_transfer` counterpart and survives
 * only for rows opened under the retired scheme.
 *
 * PROCESSING means a named admin has claimed the row — the lock that stops two
 * operators acting on the same refund. It is a real state, not decoration.
 */
export type RefundStatus =
  | "WAITING_ACCOUNT"
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

/**
 * The account a guest used to claim a `balance_claim` refund, and the proof of
 * why it was allowed to. `contact_match` / `contact_value` are frozen at claim
 * time on purpose: the user can change their email in their profile afterwards,
 * and the admin verifying two days later must see what actually matched.
 */
export interface RefundClaimedAccount {
  user_id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  claimed_at: string | null;
  /** active | suspended | banned — a non-active account is never credited. */
  account_status: string | null;
  contact_match: "email" | "phone" | null;
  contact_value: string | null;
  /** Other refunds claimed by this same account — the fraud signal. */
  sibling_claims: number;
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
  /** Null until a guest claims the refund with an account. `balance_claim` only. */
  claimed_account: RefundClaimedAccount | null;
  /** 2x24 working hours from the claim. Null while nobody has claimed it. */
  verify_due_at: string | null;
  /** Server-computed so the list and the badge cannot disagree about "late". */
  is_overdue: boolean;
  /** How many times a claim on this refund was rejected. A repeat is a signal. */
  claim_rejected_count: number;
}

export interface RefundListParams {
  status?: RefundStatus;
  method?: RefundMethod;
  /** Owed but never claimed — the outstanding-liability view. */
  unclaimed?: boolean;
  /** Claimed but past its 2x24 working-hour SLA. */
  overdue?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  per_page?: number;
}

/**
 * Counts per status, keyed by the API's own enum values, plus the two derived
 * buckets the queue is actually worked from.
 */
export type RefundStatusCounts = Partial<Record<RefundStatus, number>> & {
  unclaimed?: number;
  overdue?: number;
};

export interface PayoutDetailsPayload {
  bank_code: string;
  account_number?: string;
  account_name: string;
  account_phone?: string;
}

/** Rejecting a claimed account, which leaves the refund owed and re-claimable. */
export interface RejectClaimPayload {
  reason: string;
}
