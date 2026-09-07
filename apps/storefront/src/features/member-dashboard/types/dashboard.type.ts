export type MembershipLevel = "Member" | "Silver" | "Gold" | "Platinum";

export interface MemberProfile {
  name: string;
  email: string;
  phone: string;
  membershipLevel: MembershipLevel;
  avatarUrl?: string;
}

export interface WalletInfo {
  balance: number;
  points: number;
}

export type StatTone = "pending" | "process" | "success" | "failed" | "neutral";

export interface TransactionStat {
  key: string;
  labelKey: string;
  value: number | string;
  tone: StatTone;
  /** Optional formatted suffix shown below the value (e.g. "+28.4% ↑") */
  trend?: string;
}

export type RecentTransactionStatus = "pending" | "process" | "success" | "failed";

export interface RecentTransaction {
  id: number;
  serviceName: string;
  serviceDetail: string;
  invoiceNumber: string;
  date: string; // ISO date string
  amount: number;
  status: RecentTransactionStatus;
}

export type TransactionPaymentMethod = "bank_transfer" | "qris" | "ewallet";

export interface TransactionHistoryRow {
  id: number;
  invoiceNumber: string;
  serviceName: string;
  serviceDetail: string; // small grey sub-line (e.g. product detail)
  target: string;        // game player id, e.g. "353850607-9432"
  amount: number;
  /** "Biaya Admin" — the payment method's fee; 0 when not applicable. */
  adminFee: number;
  date: string;          // ISO date string
  status: RecentTransactionStatus;
  paymentMethod: TransactionPaymentMethod;
}

export interface HistoryFilterValues {
  service: string;  // "" = all
  payment: string;  // "" = all
  dateFrom: string; // "yyyy-MM-dd" or ""
  dateTo: string;   // "yyyy-MM-dd" or ""
}

export type HistorySort = "newest" | "oldest" | "priceHigh" | "priceLow";

export interface SidebarItem {
  key: string;
  labelKey: string;
  icon: string;
  href?: string;
}
