import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import FinanceTransactionsPage from "../pages/FinanceTransactionsPage";
import * as hooks from "../hooks/useFinance";
import type { FinanceUnifiedTransaction } from "@/types/transaction.type";

const sale: FinanceUnifiedTransaction = {
  type: "sale",
  id: 12,
  invoice_number: "INV-20260813-XY12",
  title: "Mobile Legends 86 Diamond",
  merchant: { id: 7, name: "Toko A" },
  direction: "in",
  amount: 18500,
  amount_total: 19500,
  admin_fee: 1000,
  gateway_fee: 700,
  platform_profit: 300,
  status: "COMPLETED",
  payment_channel: "QRIS",
  created_at: "2026-08-13T20:04:00+07:00",
};

const mockRows = (rows: FinanceUnifiedTransaction[]) =>
  vi.spyOn(hooks, "useFinanceTransactions").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceTransactions>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceTransactionsPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

describe("FinanceTransactionsPage", () => {
  it("shows the platform's own figures for a topup sale", () => {
    mockRows([sale]);
    renderPage();

    expect(screen.getByText("+Rp 18.500")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByText("Rp 700")).toBeInTheDocument();
    expect(screen.getByText("Rp 300")).toBeInTheDocument();
  });

  /**
   * This screen is topup-only; subscription invoices have their own pages, so
   * the feed is locked to sales and there is no "Tipe" tab/column any more.
   */
  it("queries only topup sales and shows no type tabs", () => {
    const spy = mockRows([sale]);
    renderPage();

    expect(spy).toHaveBeenCalledWith({ page: 1, per_page: 20, type: "sale" });
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Langganan")).not.toBeInTheDocument();
  });
});
