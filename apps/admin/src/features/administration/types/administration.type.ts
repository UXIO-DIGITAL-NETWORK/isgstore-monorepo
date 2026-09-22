/** Payment channels, users and settings — the operational back office. */

export interface PaymentChannel {
  id: string;
  payment_type: string;
  channel_code: string;
  name: string;
  logo_url?: string;
  description?: string;
  min_amount: number;
  fee_flat: number;
  fee_percent: number;
  sort_order: number;
  is_active: boolean;
  is_single_use: boolean;
  created_at: string;
  updated_at: string;
}

export type UserStatus = "active" | "suspended" | "banned";

export interface AdminUser {
  id: string;
  role_id: string;
  role?: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  avatar_url?: string;
  balance: number;
  point: number;
  locale: string;
  /** Account standing — drives the Suspend/Ban row actions. Defaults to active. */
  status: UserStatus;
  email_verified_at?: string;
  created_at: string;
}

/** A manual wallet credit/debit — always carries a reason for the audit trail. */
export interface BalanceAdjustmentInput {
  amount: number;
  direction: "credit" | "debit";
  reason: string;
}

/** Aggregates + membership for one account, from `GET /v1/users/{id}/overview`. */
export interface UserOverview {
  user: AdminUser;
  stats: {
    transactions_count: number;
    /** Settled money only — a PENDING order is not spend. */
    total_spent: number;
    refunds_count: number;
    topups_count: number;
  };
  membership: {
    plan: string | null;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    /** NULL `ends_at` — paid once, never expires. */
    lifetime: boolean;
  } | null;
}

/** One movement of an account's wallet. */
export interface BalanceMutationRow {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  created_at: string;
}

/** One movement of an account's points. */
export interface PointLedgerRow {
  id: string;
  type: string;
  amount: number;
  points_before: number;
  points_after: number;
  reference: string | null;
  description: string | null;
  created_at: string;
}

/** A refund tied to an account, as the buyer or as the claimant. */
export interface UserRefundRow {
  id: string;
  refund_number: string;
  invoice_number: string | null;
  amount: number;
  status: string;
  method: string;
  created_at: string;
  refunded_at: string | null;
}

export interface Setting {
  id: string;
  group: string;
  key: string;
  value: string | null;
  /** Renderable URL for an `image` setting; `value` alone is a storage path. */
  value_url?: string;
  type: "string" | "text" | "number" | "boolean" | "json" | "image";
  label?: string;
  /** Whether the storefront's public settings endpoint returns this key. */
  is_public: boolean;
}

export interface AdministrationListParams {
  search?: string;
  role_id?: string;
  role?: string;
  payment_type?: string;
  page?: number;
  per_page?: number;
}
