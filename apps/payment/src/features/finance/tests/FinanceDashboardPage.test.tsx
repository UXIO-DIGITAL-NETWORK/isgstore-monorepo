import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import FinanceDashboardPage from "../pages/FinanceDashboardPage";
import * as hooks from "../hooks/useFinance";
import type { FinanceTransaction } from "../types/finance.type";

// The "Lihat semua" shortcut is an internal router Link; stub it to a plain
// anchor so this stays a unit test of the dashboard, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const tx: FinanceTransaction = {
  id: 99,
  invoice_number: "INV-777",
  product: "Diamond 100",
  merchant: { id: 1, name: "Toko A" },
  amount_base: 10000,
  admin_fee: 2000,
  amount_total: 12000,
  gateway_fee: 300,
  platform_profit: 1700,
  status: "COMPLETED",
  payment_channel: "QRIS",
  created_at: "2026-08-11T00:00:00.000000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useFinanceDashboard").mockReturnValue({
    data: {
      saldo: 100000,
      total_admin_fee: 50000,
      total_gateway_fee: 10000,
      total_settled_to_merchants: 200000,
      pending_withdrawals: 1,
      pending_withdrawals_amount: 40000,
    },
  } as unknown as ReturnType<typeof hooks.useFinanceDashboard>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceDashboardPage />
    </QueryClientProvider>,
  );

describe("FinanceDashboardPage", () => {
  /**
   * The global markup is gone: the channel's own fee is the whole admin fee,
   * so the card reports `total_admin_fee` rather than a separate markup total.
   */
  it("reports the total admin fee rather than a markup", () => {
    vi.spyOn(hooks, "useFinanceTransactions").mockReturnValue({
      data: { rows: [], page: 1, lastPage: 1, total: 0, perPage: 5 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useFinanceTransactions>);

    renderPage();

    expect(screen.getByText("Total Biaya Admin")).toBeInTheDocument();
    expect(screen.queryByText("Total Markup")).not.toBeInTheDocument();
  });

  it("lists the most recent transactions", () => {
    vi.spyOn(hooks, "useFinanceTransactions").mockReturnValue({
      data: { rows: [tx], page: 1, lastPage: 1, total: 1, perPage: 5 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useFinanceTransactions>);

    renderPage();

    expect(screen.getByText("Transaksi Terbaru")).toBeInTheDocument();
    expect(screen.getByText("INV-777")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
  });

  it("requests only the latest five transactions", () => {
    const spy = vi.spyOn(hooks, "useFinanceTransactions").mockReturnValue({
      data: { rows: [], page: 1, lastPage: 1, total: 0, perPage: 5 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useFinanceTransactions>);

    renderPage();

    expect(spy).toHaveBeenCalledWith({ page: 1, per_page: 5 });
    expect(screen.getByText("Belum ada transaksi")).toBeInTheDocument();
  });
});
