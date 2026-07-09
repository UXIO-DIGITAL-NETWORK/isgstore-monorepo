import { OPERATOR } from "../data/operator.data";
import { STAT_CARDS } from "../data/stat-cards.data";
import { CHART_SERIES } from "../data/chart-series.data";
import { PENDING_ORDERS } from "../data/pending-orders.data";
import { ACTIVITY_LOG } from "../data/activity-log.data";
import { PERFORMANCE_ROWS } from "../data/performance-rows.data";
import type {
  Operator,
  StatCardData,
  ChartPoint,
  MonthOption,
  PendingOrders,
  ActivityLog,
  PerformanceRow,
  PerformanceTabKey,
} from "../types/dashboard.type";

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get(...)` call once the backend ships — hooks/UI stay unchanged.
// See system_architecture.md §6.
export const dashboardService = {
  getOperator: async (): Promise<Operator> => OPERATOR,

  getStatCards: async (): Promise<StatCardData[]> => STAT_CARDS,

  getChartSeries: async (month: MonthOption): Promise<ChartPoint[]> => {
    const series = CHART_SERIES[month];
    if (!series) throw new Error(`No chart series for month: ${month}`);
    return series;
  },

  getPendingOrders: async (): Promise<PendingOrders> => PENDING_ORDERS,

  getActivityLog: async (): Promise<ActivityLog[]> => ACTIVITY_LOG,

  getPerformanceRows: async (tab: PerformanceTabKey): Promise<PerformanceRow[]> => PERFORMANCE_ROWS[tab],
};
