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

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ period: "monthly" }));
  });

  it("offers yearly alongside daily and monthly", async () => {
    const spy = vi.spyOn(reportsService, "getSummary").mockResolvedValue({
      period: "daily",
      totals: { revenue: 0, transactions: 0, profit: 0 },
      breakdown: [],
    });
    const user = userEvent.setup();
    await renderRoute("/admin/reports");

    await screen.findByRole("heading", { name: "Reports" });
    const tabs = screen.getByRole("tablist");
    await user.click(within(tabs).getByRole("tab", { name: "Yearly" }));

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ period: "yearly" }));
  });

  it("asks for both dates on the custom range and does not query until it has them", async () => {
    const spy = vi.spyOn(reportsService, "getSummary").mockResolvedValue({
      period: "daily",
      totals: { revenue: 0, transactions: 0, profit: 0 },
      breakdown: [],
    });
    const user = userEvent.setup();
    await renderRoute("/admin/reports");

    await screen.findByRole("heading", { name: "Reports" });
    spy.mockClear();
    await user.click(within(screen.getByRole("tablist")).getByRole("tab", { name: "Range" }));

    expect(await screen.findByLabelText("First date")).toBeInTheDocument();
    expect(screen.getByLabelText("Last date")).toBeInTheDocument();
    expect(screen.getByText("Pick a first and last date to run the report.")).toBeInTheDocument();
    // An incomplete range is a guaranteed 422 — it must never reach the API.
    expect(spy).not.toHaveBeenCalled();
  });

  it("renders the payment-channel breakdown the page subtitle promises", async () => {
    vi.spyOn(reportsService, "getSummary").mockResolvedValue({
      period: "daily",
      timezone: "Asia/Jakarta",
      label: "Today",
      totals: { revenue: 15000, transactions: 2, profit: 1500 },
      breakdown: [{ label: "Mobile Legends", count: 2, revenue: 15000, profit: 1500 }],
      channels: [
        { label: "QRIS", count: 1, revenue: 10000, profit: 1000 },
        { label: "Balance", count: 1, revenue: 5000, profit: 500 },
      ],
    });

    await renderRoute("/admin/reports");

    expect(await screen.findByText("Payment Channel")).toBeInTheDocument();
    expect(screen.getByText("QRIS")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });
});
