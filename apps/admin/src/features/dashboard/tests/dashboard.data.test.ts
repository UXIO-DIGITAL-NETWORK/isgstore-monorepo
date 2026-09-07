import { describe, it, expect } from "vitest";
import { STAT_CARDS } from "../data/stat-cards.data";
import { CHART_SERIES } from "../data/chart-series.data";
import { PENDING_ORDERS } from "../data/pending-orders.data";
import { ACTIVITY_LOG } from "../data/activity-log.data";
import { PERFORMANCE_ROWS } from "../data/performance-rows.data";

// The operator fixture and its test were removed with the mock operator —
// the navbar/banner identity now comes from the real login response via
// useAuthStore (see DashboardNavbar.test.tsx).

describe("stat-cards.data", () => {
  it("has the three reference stat cards with exact figures", () => {
    expect(STAT_CARDS).toHaveLength(3);

    const credit = STAT_CARDS.find((c) => c.label === "Credit");
    expect(credit).toMatchObject({ value: 15231.89, deltaPct: 12.5, direction: "up", caption: "Since last month" });

    const debit = STAT_CARDS.find((c) => c.label === "Debit");
    expect(debit).toMatchObject({ value: 15231.89, deltaPct: 20, direction: "down", caption: "Since last month" });

    const todaysSales = STAT_CARDS.find((c) => c.label === "Today's Sales");
    expect(todaysSales).toMatchObject({
      value: 15231.89,
      deltaPct: 12.5,
      direction: "up",
      caption: "Since last month",
    });
  });
});

describe("chart-series.data", () => {
  it("provides series for january, february, march with ascending dates", () => {
    (["january", "february", "march"] as const).forEach((month) => {
      const series = CHART_SERIES[month];
      expect(series.length).toBeGreaterThanOrEqual(6);

      const timestamps = series.map((p) => new Date(p.date).getTime());
      const sorted = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sorted);

      series.forEach((point) => {
        expect(point.netIncome).toBeLessThan(point.revenue);
      });
    });
  });
});

describe("pending-orders.data", () => {
  it("matches the reference figures", () => {
    expect(PENDING_ORDERS).toEqual({
      manualOrders: 16,
      pendingPayment: 14,
      processing: 8,
      failedTransaction: 20,
    });
  });
});

describe("activity-log.data", () => {
  it("has 5 entries in descending recency order", () => {
    expect(ACTIVITY_LOG).toHaveLength(5);
    const timestamps = ACTIVITY_LOG.map((a) => new Date(a.timestamp).getTime());
    const sortedDesc = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sortedDesc);
    ACTIVITY_LOG.forEach((entry) => {
      expect(entry.actor).toBe("Randy Galang");
      expect(entry.action).toBe("Stock Update");
      expect(entry.role).toBe("Admin");
    });
  });
});

describe("performance-rows.data", () => {
  it("has the exact reference category rows", () => {
    expect(PERFORMANCE_ROWS.category).toEqual([
      expect.objectContaining({
        name: "Mobile Legend Indonesia",
        subLabel: "Moonton",
        totalTransaction: 23,
        revenue: 32,
      }),
      expect.objectContaining({ name: "Genshin Impact", subLabel: "Mihoyo", totalTransaction: 45, revenue: 8 }),
      expect.objectContaining({ name: "Valorant", subLabel: "Riot Games", totalTransaction: 45, revenue: 45 }),
      expect.objectContaining({ name: "Free Fire", subLabel: "Garena", totalTransaction: 45, revenue: 45 }),
      expect.objectContaining({ name: "PUBG Mobile", subLabel: "Tencent", totalTransaction: 23, revenue: 23 }),
    ]);
  });

  it("has plausible product and user rows", () => {
    expect(PERFORMANCE_ROWS.product.length).toBeGreaterThanOrEqual(4);
    expect(PERFORMANCE_ROWS.user.length).toBeGreaterThanOrEqual(4);
  });
});
