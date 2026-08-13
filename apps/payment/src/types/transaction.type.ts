/**
 * The unified transaction feed — sales the client made (money in) and the
 * service bills kita issued them (money out) in one list.
 *
 * Shared between both slices because they render the same row shape, same
 * reason as service.type.ts and withdrawal.type.ts.
 */

export type TransactionType = "sale" | "service";

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
