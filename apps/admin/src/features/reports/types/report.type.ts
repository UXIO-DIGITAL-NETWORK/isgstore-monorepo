/** Reporting hub (product_requirements.md §5) — a consolidated revenue view. */

export type ReportPeriod = "daily" | "monthly" | "yearly" | "custom";

/** One breakdown line — per game/product, or per payment channel. */
export interface ReportBreakdownRow {
  label: string;
  count: number;
  revenue: number;
  /** The header shows Net Profit; this is the row's share of it. Optional while the API rolls out. */
  profit?: number;
}

/**
 * `dateFrom`/`dateTo` are calendar days (`YYYY-MM-DD`) and are only sent —
 * and only honoured — when `period` is `"custom"`. The API 422s a custom
 * period without them rather than silently falling back to today.
 */
export interface ReportSummaryParams {
  period: ReportPeriod;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportSummary {
  period: ReportPeriod;
  /** Caption for the window, resolved server-side in the admin's timezone ("Today", "Sep 1, 2026 – Sep 3, 2026"). */
  label?: string;
  /** The IANA zone the window was computed in — the same value the navbar clock renders. */
  timezone?: string;
  totals: { revenue: number; transactions: number; profit: number };
  breakdown: ReportBreakdownRow[];
  /** Per payment channel. Optional so pre-existing fixtures still typecheck. */
  channels?: ReportBreakdownRow[];
}
