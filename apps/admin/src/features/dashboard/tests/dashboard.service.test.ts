import { describe, it, expect } from "vitest";
import { dashboardService } from "../services/dashboard.service";
import { STAT_CARDS } from "../data/stat-cards.data";
import { CHART_SERIES } from "../data/chart-series.data";
import { PENDING_ORDERS } from "../data/pending-orders.data";
import { ACTIVITY_LOG } from "../data/activity-log.data";
import { PERFORMANCE_ROWS } from "../data/performance-rows.data";

describe("dashboardService", () => {
  it("getStatCards resolves the stat-card fixtures", async () => {
    await expect(dashboardService.getStatCards()).resolves.toEqual(STAT_CARDS);
  });

  it("getChartSeries resolves the fixture for a known month", async () => {
    await expect(dashboardService.getChartSeries("january")).resolves.toEqual(CHART_SERIES.january);
  });

  it("getChartSeries throws for an unknown month", async () => {
    // @ts-expect-error -- intentionally passing an invalid month to test runtime behavior
    await expect(dashboardService.getChartSeries("unknown")).rejects.toThrow();
  });

  it("getPendingOrders resolves the fixture", async () => {
    await expect(dashboardService.getPendingOrders()).resolves.toEqual(PENDING_ORDERS);
  });

  it("getActivityLog resolves the fixture", async () => {
    await expect(dashboardService.getActivityLog()).resolves.toEqual(ACTIVITY_LOG);
  });

  it("getPerformanceRows resolves the fixture for a tab", async () => {
    await expect(dashboardService.getPerformanceRows("category")).resolves.toEqual(PERFORMANCE_ROWS.category);
  });
});
