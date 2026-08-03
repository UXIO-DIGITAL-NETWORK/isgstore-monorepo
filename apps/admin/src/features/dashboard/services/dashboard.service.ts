import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  ActivityLog,
  ChartPoint,
  MonthOption,
  PendingOrders,
  PerformanceRow,
  PerformanceTabKey,
  StatCardData,
} from "../types/dashboard.type";

const STATS = `${API_VERSION}/dashboard/stats`;

interface StatCardApiRow {
  key: "credit" | "debit" | "todays_sales";
  value: number;
  delta_pct: number | null;
  direction: "up" | "down" | null;
  caption: string;
}

interface DashboardStatsApiResponse {
  totals: { users: number; transactions: number };
  stat_cards: StatCardApiRow[];
  pending_orders: {
    manual_orders: number;
    pending_payment: number;
    processing: number;
    failed_transaction: number;
  };
  chart: { date: string; transactions: number; revenue: number; net_income: number }[];
}

interface ActivityLogApiRow {
  id: number;
  actor: string;
  role: string | null;
  message: string;
  created_at: string;
}

interface PerformanceApiRow {
  id: number;
  name: string;
  sub_label: string | null;
  total_transaction: number;
  revenue: number;
}

/** The API sends a stable key per card; the human label belongs to the client. */
const CARD_LABELS: Record<StatCardApiRow["key"], string> = {
  credit: "Credit",
  debit: "Debit",
  todays_sales: "Today's Sales",
};

/**
 * The month selector offers three fixed options. The API scopes the chart by
 * calendar month number, so they map onto months of the current year rather
 * than being a decorative filter.
 */
const MONTH_NUMBERS: Record<MonthOption, number> = { january: 1, february: 2, march: 3 };

const toStatCard = (row: StatCardApiRow): StatCardData => ({
  id: row.key,
  label: CARD_LABELS[row.key] ?? row.key,
  value: row.value,
  // Sent as a pair or not at all — StatCard shows its trend pill only when
  // both are present, and the API nulls them when there is nothing to compare.
  ...(row.delta_pct !== null && row.direction !== null
    ? { deltaPct: row.delta_pct, direction: row.direction }
    : {}),
  caption: row.caption,
});

/**
 * `stats` is one composite document, so every widget on the page would
 * otherwise refetch it. The in-flight promise is shared for a tick, which is
 * enough for the four hooks that mount together on first render; TanStack
 * Query's cache handles everything after that.
 */
let statsInFlight: Promise<DashboardStatsApiResponse> | null = null;

const requestStats = async (month?: MonthOption): Promise<DashboardStatsApiResponse> => {
  const response: ApiResponse<DashboardStatsApiResponse> = await api.get(
    STATS,
    month ? { params: { month: MONTH_NUMBERS[month] } } : undefined,
  );
  return response.data;
};

const fetchStats = (month?: MonthOption): Promise<DashboardStatsApiResponse> => {
  // A month-scoped read is its own query and must not be shared with (or
  // poison) the default window's in-flight promise.
  if (month) return requestStats(month);

  statsInFlight ??= requestStats().finally(() => {
    statsInFlight = null;
  });

  return statsInFlight;
};

export const dashboardService = {
  getStatCards: async (): Promise<StatCardData[]> => {
    const stats = await fetchStats();
    return stats.stat_cards.map(toStatCard);
  },

  getChartSeries: async (month: MonthOption): Promise<ChartPoint[]> => {
    const stats = await fetchStats(month);
    return stats.chart.map((point) => ({
      date: point.date,
      revenue: point.revenue,
      // Margin, not revenue — plotting revenue twice would say nothing.
      netIncome: point.net_income,
    }));
  },

  getPendingOrders: async (): Promise<PendingOrders> => {
    const stats = await fetchStats();
    return {
      manualOrders: stats.pending_orders.manual_orders,
      pendingPayment: stats.pending_orders.pending_payment,
      processing: stats.pending_orders.processing,
      failedTransaction: stats.pending_orders.failed_transaction,
    };
  },

  getActivityLog: async (): Promise<ActivityLog[]> => {
    const response: ApiResponse<PaginatedResponse<ActivityLogApiRow>> = await api.get(`${API_VERSION}/activity-logs`, {
      params: { per_page: 10 },
    });

    return response.data.data.map((row) => ({
      id: toRowId(row.id),
      actor: row.actor,
      // The API stores one human-readable sentence; there is no separate
      // structured action field to split it into.
      action: row.message,
      role: row.role ?? "",
      timestamp: row.created_at,
    }));
  },

  getPerformanceRows: async (tab: PerformanceTabKey): Promise<PerformanceRow[]> => {
    const response: ApiResponse<PerformanceApiRow[]> = await api.get(`${API_VERSION}/dashboard/performance`, {
      params: { tab },
    });

    return response.data.map((row) => ({
      id: toRowId(row.id),
      name: row.name,
      subLabel: row.sub_label ?? "",
      totalTransaction: row.total_transaction,
      revenue: row.revenue,
    }));
  },
};
