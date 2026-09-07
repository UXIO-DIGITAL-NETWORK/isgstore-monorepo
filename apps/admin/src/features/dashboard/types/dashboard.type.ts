export type { TrendDirection } from "@/components/common/TrendPill";
export type { StatCardData } from "@/components/common/StatCard";

/** date is an ISO string. */
export type ChartPoint = {
  date: string;
  revenue: number;
  netIncome: number;
};

/**
 * The chart's month selector. The API validates `month` as 1..12, so all
 * twelve are offered — the list used to stop at March, a leftover from the
 * fixture shape that made April onward unreachable.
 *
 * Declared once here and derived everywhere else so the labels, the option
 * list and the API's month numbers cannot drift apart.
 */
export const MONTH_OPTIONS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type MonthOption = (typeof MONTH_OPTIONS)[number];

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
