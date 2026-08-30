/**
 * The unified transaction feed — sales the client made (money in) and the
 * service bills kita issued them (money out) in one list.
 *
 * Shared between both slices because they render the same row shape, same
 * reason as service.type.ts and withdrawal.type.ts.
 */

export type TransactionType = "sale" | "service";

/** The Payment Gateway half — did the customer pay? `CANCELLED` is service-bill only. */
export type PaymentLifecycle = "PENDING" | "SUCCESS" | "EXPIRED" | "REFUNDED" | "CANCELLED";

/**
 * The Topup Provider half — did the supplier deliver?
 *
 * Null on a service-invoice row: a bill kita issued has no supplier behind it.
 */
export type ProviderLifecycle =
  | "NOT_ORDERED"
  | "QUEUED"
  | "SENDING"
  | "ORDERED"
  | "UNCONFIRMED"
  | "DELIVERED"
  | "REJECTED"
  | "UNDELIVERED";

/** Client-relative in BOTH roles: "in" = money into the client. */
export type TransactionDirection = "in" | "out";

export interface UnifiedTransaction {
  type: TransactionType;
  /** Unique only WITHIN a type — key rows on `${type}-${id}`. */
  id: number;
  invoice_number: string;
  title: string | null;
  direction: TransactionDirection;
  amount: number;
  status: string;
  /**
   * The two halves `status` conflates. Optional: absent when the API predates
   * the split, in which case src/lib/transactionStatus.ts derives them.
   */
  payment_status?: PaymentLifecycle | null;
  provider_status?: ProviderLifecycle | null;
  payment_channel: string | null;
  created_at: string;
}

export interface FinanceUnifiedTransaction extends UnifiedTransaction {
  merchant: { id: number; name: string } | null;
  amount_total: number;
  /** Genuinely 0 on a service bill — it has no payment channel behind it. */
  admin_fee: number;
  gateway_fee: number;
  platform_profit: number;
}

/**
 * Status-bucket counts + totals for the summary pills and the Recap dialog.
 * Honours every list filter except the status bucket, so the pills always show
 * the full distribution of the current search/type/date/merchant scope.
 */
export interface TransactionSummary {
  count_total: number;
  count_success: number;
  count_pending: number;
  count_failed: number;
  /** Sum of the client-relative amount across the filtered set. */
  amount_total: number;
}

/** The internal view also sees the platform's own money. */
export interface FinanceTransactionSummary extends TransactionSummary {
  /** Sum of what customers actually paid (gross). */
  gross_total: number;
  admin_fee_total: number;
  gateway_fee_total: number;
  platform_profit_total: number;
}
