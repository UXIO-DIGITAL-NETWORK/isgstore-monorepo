import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { makeUser, renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { reportsService } from "../services/reports.service";

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("ReportsPage", () => {
  it("renders the consolidated totals and breakdown for the default (daily) period", async () => {
    vi.spyOn(reportsService, "getSummary").mockResolvedValue({
      period: "daily",
      totals: { revenue: 1500000, transactions: 42, profit: 250000 },
      breakdown: [{ label: "Mobile Legends", count: 30, revenue: 900000 }],
    });

    await renderRoute("/admin/reports");

    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(await screen.findByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Net Profit")).toBeInTheDocument();
    expect(await screen.findByText("Mobile Legends")).toBeInTheDocument();
  });

  it("re-queries the service when the period tab switches to monthly", async () => {
    const spy = vi.spyOn(reportsService, "getSummary").mockResolvedValue({
      period: "daily",
      totals: { revenue: 0, transactions: 0, profit: 0 },
      breakdown: [],
    });
    const user = userEvent.setup();
    await renderRoute("/admin/reports");

    await screen.findByRole("heading", { name: "Reports" });
    const tabs = screen.getByRole("tablist");
    await user.click(within(tabs).getByRole("tab", { name: "Monthly" }));

    expect(spy).toHaveBeenCalledWith("monthly");
  });
});
