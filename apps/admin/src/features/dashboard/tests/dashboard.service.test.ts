import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { dashboardService } from "../services/dashboard.service";

vi.mock("@/lib/axios", () => ({ api: { get: vi.fn() } }));

const stats = (over: Record<string, unknown> = {}) =>
  envelope({
    totals: { users: 190, transactions: 42 },
    stat_cards: [
      { key: "credit", value: 15231.89, delta_pct: 12.5, direction: "up", caption: "Since last month" },
      { key: "debit", value: 1200, delta_pct: 20, direction: "down", caption: "Since last month" },
      { key: "todays_sales", value: 800, delta_pct: 5, direction: "up", caption: "Since last month" },
    ],
    pending_orders: { manual_orders: 3, pending_payment: 7, processing: 2, failed_transaction: 1 },
    chart: [{ date: "2026-07-01", transactions: 4, revenue: 5000, net_income: 900 }],
    ...over,
  });

beforeEach(() => vi.clearAllMocks());

describe("dashboardService.getStatCards", () => {
  it("labels the API's stable keys for display", async () => {
    vi.mocked(api.get).mockResolvedValue(stats());

    const result = await dashboardService.getStatCards();

    expect(api.get).toHaveBeenCalledWith("/v1/dashboard/stats", undefined);
    expect(result.map((card) => card.label)).toEqual(["Credit", "Debit", "Today's Sales"]);
    expect(result[0]).toMatchObject({ value: 15231.89, deltaPct: 12.5, direction: "up" });
  });
});

describe("dashboardService.getChartSeries", () => {
  /**
   * The chart plots two series against each other. `net_income` is margin, not
   * revenue — plotting revenue twice would tell the operator nothing about
   * whether the volume was profitable.
   */
  it("plots net income from margin, not from revenue", async () => {
    vi.mocked(api.get).mockResolvedValue(stats());

    const result = await dashboardService.getChartSeries("january");

    expect(result[0]).toEqual({ date: "2026-07-01", revenue: 5000, netIncome: 900 });
  });

  it("translates the month option into the API's month number", async () => {
    vi.mocked(api.get).mockResolvedValue(stats());

    await dashboardService.getChartSeries("march");

    expect(api.get).toHaveBeenCalledWith("/v1/dashboard/stats", { params: { month: 3 } });
  });
});

describe("dashboardService.getPendingOrders", () => {
  it("maps the snake_case counts onto the camelCase widget shape", async () => {
    vi.mocked(api.get).mockResolvedValue(stats());

    await expect(dashboardService.getPendingOrders()).resolves.toEqual({
      manualOrders: 3,
      pendingPayment: 7,
      processing: 2,
      failedTransaction: 1,
    });
  });
});

describe("dashboardService.getActivityLog", () => {
  it("reads the paginated activity feed and maps message onto action", async () => {
    vi.mocked(api.get).mockResolvedValue(
      paginated([
        { id: 4, actor: "Super Admin", role: "admin", message: "Updated Product: X", created_at: "2026-07-01T00:00:00Z" },
      ]),
    );

    const result = await dashboardService.getActivityLog();

    expect(api.get).toHaveBeenCalledWith("/v1/activity-logs", { params: { per_page: 10 } });
    expect(result[0]).toEqual({
      id: "4",
      actor: "Super Admin",
      action: "Updated Product: X",
      role: "admin",
      timestamp: "2026-07-01T00:00:00Z",
    });
  });
});

describe("dashboardService.getPerformanceRows", () => {
  it("passes the tab through and maps the row shape", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([{ id: 2, name: "Free Fire", sub_label: "Garena", total_transaction: 45, revenue: 45 }]),
    );

    const result = await dashboardService.getPerformanceRows("category");

    expect(api.get).toHaveBeenCalledWith("/v1/dashboard/performance", { params: { tab: "category" } });
    expect(result[0]).toEqual({
      id: "2",
      name: "Free Fire",
      subLabel: "Garena",
      totalTransaction: 45,
      revenue: 45,
    });
  });
});
