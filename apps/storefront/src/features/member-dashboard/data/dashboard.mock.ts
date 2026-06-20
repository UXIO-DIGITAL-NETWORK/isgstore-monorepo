import type {
  MemberProfile,
  WalletInfo,
  TransactionStat,
  RecentTransaction,
} from "@/features/member-dashboard/types/dashboard.type";

export const MOCK_MEMBER_PROFILE: MemberProfile = {
  name: "Ramonez Zyn",
  email: "Ramonezz_3@gmail.com",
  phone: "+62 8737 1735 834",
  membershipLevel: "Member",
  avatarUrl: undefined,
};

export const MOCK_WALLET: WalletInfo = {
  balance: 3400,
  points: 0,
};

export const MOCK_TRANSACTION_STATS: TransactionStat[] = [
  {
    key: "pending",
    labelKey: "stats.pending",
    value: 0,
    tone: "pending",
  },
  {
    key: "process",
    labelKey: "stats.inProcess",
    value: 1,
    tone: "process",
  },
  {
    key: "success",
    labelKey: "stats.success",
    value: 3,
    tone: "success",
  },
  {
    key: "failed",
    labelKey: "stats.failed",
    value: 0,
    tone: "failed",
  },
  {
    key: "total",
    labelKey: "stats.totalTransactions",
    value: 12,
    tone: "neutral",
    trend: "+28.4% ↑",
  },
  {
    key: "sales",
    labelKey: "stats.totalSales",
    value: 31256,
    tone: "neutral",
    trend: "+30.2% ↑",
  },
];

export const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  {
    id: 1,
    serviceName: "Mobile Legends Indonesia",
    serviceDetail: "5 Diamond (5 + 0 Bonus)",
    invoiceNumber: "HOM20xxxxxxxxxxINV",
    date: "2026-05-10T20:45:00.000Z",
    amount: 26549,
    status: "pending",
  },
  {
    id: 2,
    serviceName: "10050 (8540+1510) Diamond",
    serviceDetail: "ID: 1",
    invoiceNumber: "HOM20xxxxxxxxxxINV",
    date: "2026-05-10T20:45:00.000Z",
    amount: 2409,
    status: "success",
  },
  {
    id: 3,
    serviceName: "Mobile Legends Indonesia",
    serviceDetail: "5 Diamond (5 + 0 Bonus)",
    invoiceNumber: "HOM20xxxxxxxxxxINV",
    date: "2026-05-10T20:45:00.000Z",
    amount: 26549,
    status: "success",
  },
  {
    id: 4,
    serviceName: "10050 (8540+1510) Diamond",
    serviceDetail: "ID: 1",
    invoiceNumber: "HOM20xxxxxxxxxxINV",
    date: "2026-05-10T20:45:00.000Z",
    amount: 2409,
    status: "success",
  },
];
