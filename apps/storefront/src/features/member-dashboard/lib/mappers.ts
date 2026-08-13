import type {
  RecentTransaction,
  RecentTransactionStatus,
  TransactionHistoryRow,
  TransactionPaymentMethod,
} from "@/features/member-dashboard/types/dashboard.type";
import type { ActivityLogRow, ActivityType } from "@/features/member-dashboard/types/activityLog.type";
import type { MemberActivityLogRow } from "@/features/member-dashboard/services/member.service";
import type { TransactionStatus, TransactionSummaryModel } from "@/types/models/transaction.model";

/**
 * The API's seven statuses collapsed into the four the dashboard renders.
 * Paid-but-not-yet-delivered is one "process" state to the customer, and every
 * unhappy ending reads as "failed".
 */
const STATUS_MAP: Record<TransactionStatus, RecentTransactionStatus> = {
  PENDING: "pending",
  PAID: "process",
  PROCESSING: "process",
  COMPLETED: "success",
  FAILED_PROVIDER: "failed",
  EXPIRED: "failed",
  REFUNDED: "failed",
};

/** Gateway payment types mapped to the three the filter panel offers. */
const PAYMENT_METHOD_MAP: Record<string, TransactionPaymentMethod> = {
  virtual_account: "bank_transfer",
  qris: "qris",
  ewallet: "ewallet",
  convenience_store: "bank_transfer",
  payment_link: "bank_transfer",
};

export function toRecentTransaction(row: TransactionSummaryModel): RecentTransaction {
  return {
    id: row.id ?? 0,
    serviceName: row.service_name ?? "",
    serviceDetail: row.service_detail ?? "",
    invoiceNumber: row.invoice_number,
    date: row.created_at,
    amount: row.amount,
    status: STATUS_MAP[row.status],
  };
}

export function toHistoryRow(row: TransactionSummaryModel): TransactionHistoryRow {
  return {
    id: row.id ?? 0,
    invoiceNumber: row.invoice_number,
    serviceName: row.service_name ?? "",
    serviceDetail: row.service_detail ?? "",
    target: row.target ?? "",
    amount: row.amount,
    adminFee: row.admin_fee ?? 0,
    date: row.created_at,
    status: STATUS_MAP[row.status],
    paymentMethod: PAYMENT_METHOD_MAP[row.payment_method ?? ""] ?? "bank_transfer",
  };
}

const ACTIVITY_TYPES: readonly ActivityType[] = [
  "login",
  "membership",
  "transaction",
  "security",
  "verification",
  "failed",
];

export function toActivityRow(row: MemberActivityLogRow): ActivityLogRow {
  const type = ACTIVITY_TYPES.includes(row.type as ActivityType)
    ? (row.type as ActivityType)
    // Rows written before `activity_logs.type` existed carry no classification;
    // they land in the generic bucket rather than being hidden.
    : "login";

  return {
    id: row.id,
    type,
    // The API stores one human-readable message rather than a title/description
    // pair, so it fills the title and the row renders without a second line.
    titleKey: row.message,
    descKey: "",
    date: row.created_at,
    ip: row.ip_address ?? "",
    // No geo-IP lookup exists server-side; showing a fabricated city would be
    // worse than showing none.
    location: "",
  };
}
