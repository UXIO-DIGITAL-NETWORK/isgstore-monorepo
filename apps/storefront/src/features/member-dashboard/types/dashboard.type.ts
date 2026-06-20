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

export type RecentTransactionStatus = "pending" | "success" | "failed";

export interface RecentTransaction {
  id: number;
  serviceName: string;
  serviceDetail: string;
  invoiceNumber: string;
  date: string; // ISO date string
  amount: number;
  status: RecentTransactionStatus;
}

export interface SidebarItem {
  key: string;
  labelKey: string;
  icon: string;
  href?: string;
}
