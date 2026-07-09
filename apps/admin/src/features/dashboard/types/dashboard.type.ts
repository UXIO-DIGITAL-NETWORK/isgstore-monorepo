export type Operator = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  roles: string[];
  permissions: string[];
  email_verified_at: string;
  two_factor_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type TrendDirection = "up" | "down";

export type StatCardData = {
  id: string;
  label: string;
  value: number;
  deltaPct: number;
  direction: TrendDirection;
  caption: string;
};

/** date is an ISO string. */
export type ChartPoint = {
  date: string;
  revenue: number;
  netIncome: number;
};

export type MonthOption = "january" | "february" | "march";

export type PendingOrders = {
  manualOrders: number;
  pendingPayment: number;
  processing: number;
  failedTransaction: number;
};

/**
 * timestamp is an ISO string. Relative formatting ("5m Ago") happens at
 * render time in the UI layer via formatRelativeTime (src/utils/date.ts) —
 * never bake a relative string into the fixture.
 */
export type ActivityLog = {
  id: string;
  actor: string;
  action: string;
  role: string;
  timestamp: string;
  avatarUrl?: string;
};

export type PerformanceRow = {
  id: string;
  name: string;
  subLabel: string;
  avatarUrl?: string;
  totalTransaction: number;
  revenue: number;
};

export type PerformanceTabKey = "category" | "product" | "user";
