import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { ReportBreakdownRow, ReportSummary, ReportSummaryParams } from "../types/report.type";

const BASE = `${API_VERSION}/reports`;

interface ApiBreakdownRow {
  label: string;
  count: number;
  revenue: number;
  profit?: number;
}

interface ReportSummaryApiShape {
  label?: string;
  timezone?: string;
  total_revenue?: number;
  total_transactions?: number;
  total_profit?: number;
  /** Alias of `product_breakdown`, kept by the API for one release. */
  breakdown?: ApiBreakdownRow[];
  product_breakdown?: ApiBreakdownRow[];
  channel_breakdown?: ApiBreakdownRow[];
}

const mapRows = (rows: ApiBreakdownRow[] | undefined): ReportBreakdownRow[] =>
  (rows ?? []).map((row) => ({
    label: row.label,
    count: row.count,
    revenue: row.revenue,
    profit: row.profit,
  }));

/**
 * Reporting hub data (product_requirements.md §5). Read-only aggregation the
 * backend groups server-side — including the period boundaries, which are
 * resolved in the logged-in admin's timezone rather than here.
 */
export const reportsService = {
  getSummary: async (params: ReportSummaryParams = { period: "daily" }): Promise<ReportSummary> => {
    const response: ApiResponse<ReportSummaryApiShape> = await api.get(`${BASE}/summary`, {
      params: {
        period: params.period,
        // Only meaningful for `custom`; omitted otherwise so the period name
        // stays the single source of truth for the window.
        ...(params.period === "custom" ? { date_from: params.dateFrom, date_to: params.dateTo } : {}),
      },
    });
    const data = response.data;
    const breakdown = mapRows(data.product_breakdown ?? data.breakdown);

    return {
      period: params.period,
      label: data.label,
      timezone: data.timezone,
      totals: {
        revenue: data.total_revenue ?? breakdown.reduce((sum, row) => sum + row.revenue, 0),
        transactions: data.total_transactions ?? breakdown.reduce((sum, row) => sum + row.count, 0),
        profit: data.total_profit ?? 0,
      },
      breakdown,
      channels: mapRows(data.channel_breakdown),
    };
  },
};
