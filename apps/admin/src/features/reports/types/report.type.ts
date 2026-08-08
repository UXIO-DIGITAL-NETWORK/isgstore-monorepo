/** Reporting hub (product_requirements.md §5) — a consolidated revenue view. */

export type ReportPeriod = "daily" | "monthly";

/** One breakdown line — per game/product/payment channel. */
export interface ReportBreakdownRow {
  label: string;
  count: number;
  revenue: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  totals: { revenue: number; transactions: number; profit: number };
  breakdown: ReportBreakdownRow[];
}
