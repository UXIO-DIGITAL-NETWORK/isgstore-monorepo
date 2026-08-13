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

const bill: FinanceUnifiedTransaction = {
  type: "service",
  id: 9,
  invoice_number: "SINV-202608-A1B2C3",
  title: "Digiflazz",
  merchant: { id: 7, name: "Toko A" },
  direction: "out",
  amount: 250000,
  amount_total: 250000,
  admin_fee: 0,
  gateway_fee: 0,
  platform_profit: 250000,
  status: "PAID",
  payment_channel: null,
  created_at: "2026-08-14T09:12:00+07:00",
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
  it("shows the client's direction and the platform's own figures", () => {
    mockRows([sale]);
    renderPage();

    expect(screen.getByText("+Rp 18.500")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByText("Rp 700")).toBeInTheDocument();
    expect(screen.getByText("Rp 300")).toBeInTheDocument();
  });

  /**
   * A service bill has no channel and no gateway, so "Rp 0" would read as a
   * measured zero rather than an inapplicable one.
   */
  it("renders a dash, not zero, for the fees on a service row", () => {
    mockRows([bill]);
    renderPage();

    expect(screen.getByText("−Rp 250.000")).toBeInTheDocument();
    expect(screen.queryByText("Rp 0")).not.toBeInTheDocument();
    // Metode, Biaya Admin and Fee Gateway all read "—" on this row.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });
});
