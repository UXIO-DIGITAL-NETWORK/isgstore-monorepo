import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { ReportPeriod, ReportSummary } from "../types/report.type";

const BASE = `${API_VERSION}/reports`;

interface ReportSummaryApiShape {
  total_revenue?: number;
  total_transactions?: number;
  total_profit?: number;
  breakdown?: { label: string; count: number; revenue: number }[];
}

/**
 * Reporting hub data (product_requirements.md §5). Read-only aggregation the
 * backend groups server-side; the mapper only normalises field names and fills
 * the totals footer defensively when the API omits it.
 */
export const reportsService = {
  getSummary: async (period: ReportPeriod = "daily"): Promise<ReportSummary> => {
    const response: ApiResponse<ReportSummaryApiShape> = await api.get(`${BASE}/summary`, { params: { period } });
    const data = response.data;
    const breakdown = (data.breakdown ?? []).map((row) => ({
      label: row.label,
      count: row.count,
      revenue: row.revenue,
    }));
    return {
      period,
      totals: {
        revenue: data.total_revenue ?? breakdown.reduce((sum, row) => sum + row.revenue, 0),
        transactions: data.total_transactions ?? breakdown.reduce((sum, row) => sum + row.count, 0),
        profit: data.total_profit ?? 0,
      },
      breakdown,
    };
  },
};
