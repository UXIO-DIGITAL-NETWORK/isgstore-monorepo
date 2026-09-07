import type { ChartPoint } from "../types/dashboard.type";

/**
 * Test-only fixture (consumed by `src/test/fakeApi.ts` and the colocated data
 * test), covering Q1 only. Typed on exactly the months it actually has rather
 * than on the full `MonthOption` union, so it stays honest about its coverage
 * instead of claiming a year it does not provide.
 */
export const CHART_SERIES: Record<"january" | "february" | "march", ChartPoint[]> = {
  january: [
    { date: "2026-01-01", revenue: 4200, netIncome: 2100 },
    { date: "2026-01-05", revenue: 3800, netIncome: 1900 },
    { date: "2026-01-10", revenue: 5100, netIncome: 2600 },
    { date: "2026-01-15", revenue: 4700, netIncome: 2300 },
    { date: "2026-01-20", revenue: 6200, netIncome: 3100 },
    { date: "2026-01-25", revenue: 5900, netIncome: 2950 },
  ],
  february: [
    { date: "2026-02-01", revenue: 4600, netIncome: 2300 },
    { date: "2026-02-05", revenue: 5200, netIncome: 2650 },
    { date: "2026-02-10", revenue: 4900, netIncome: 2400 },
    { date: "2026-02-15", revenue: 6100, netIncome: 3050 },
    { date: "2026-02-20", revenue: 5800, netIncome: 2900 },
    { date: "2026-02-25", revenue: 6700, netIncome: 3350 },
  ],
  march: [
    { date: "2026-03-01", revenue: 5000, netIncome: 2500 },
    { date: "2026-03-05", revenue: 5400, netIncome: 2700 },
    { date: "2026-03-10", revenue: 6300, netIncome: 3150 },
    { date: "2026-03-15", revenue: 5900, netIncome: 2950 },
    { date: "2026-03-20", revenue: 7000, netIncome: 3500 },
    { date: "2026-03-25", revenue: 6500, netIncome: 3250 },
  ],
};
