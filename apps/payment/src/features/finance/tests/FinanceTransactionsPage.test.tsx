import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";

import FinanceTransactionsPage from "../pages/FinanceTransactionsPage";
import * as hooks from "../hooks/useFinance";
import type { FinanceTransactionSummary, FinanceUnifiedTransaction } from "@/types/transaction.type";

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

const mockSummary = (over: Partial<FinanceTransactionSummary> = {}) =>
  vi.spyOn(hooks, "useFinanceTransactionSummary").mockReturnValue({
    data: {
      count_total: 1,
      count_success: 1,
      count_pending: 0,
      count_failed: 0,
      amount_total: 18500,
      gross_total: 19500,
      admin_fee_total: 1000,
      gateway_fee_total: 700,
      platform_profit_total: 300,
      ...over,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useFinanceTransactionSummary>);

const mockMerchants = () =>
  vi.spyOn(hooks, "useFinanceMerchants").mockReturnValue({
    data: { rows: [{ id: 7, name: "Toko A" }], page: 1, lastPage: 1, total: 1, perPage: 100 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceMerchants>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceTransactionsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockSummary();
  mockMerchants();
});

describe("FinanceTransactionsPage", () => {
  it("shows the platform's own figures for a topup sale", () => {
    mockRows([sale]);
    renderPage();

    expect(screen.getByText("Net +Rp 18.500")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByText("Rp 700")).toBeInTheDocument();
    // Row profit and the summary "Profit Kita" pill total are both Rp 300.
    expect(screen.getAllByText("Rp 300").length).toBeGreaterThan(0);
  });

  it("queries the full feed with the default filters", () => {
    const spy = mockRows([sale]);
    renderPage();

    expect(spy).toHaveBeenCalledWith({ page: 1, per_page: 20, type: "all" });
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("shows the internal profit total in the summary pills", () => {
    mockRows([sale]);
    mockSummary({ count_success: 4 });
    renderPage();

    expect(screen.getByRole("button", { name: /Sukses/i })).toHaveTextContent("4");
  });

  it("keeps every provider state distinct for the internal view", () => {
    // The merchant view folds these into "Diproses"; kita is the one who has to
    // chase the row where we lost the supplier's order id, so it must be named.
    mockRows([{ ...sale, status: "PROCESSING", provider_status: "UNCONFIRMED" }]);
    renderPage();

    expect(within(screen.getByRole("table")).getByText("Belum Terkonfirmasi")).toBeInTheDocument();
  });

  it("separates a supplier refusal from a missing verdict", () => {
    mockRows([{ ...sale, status: "FAILED_PROVIDER", provider_status: "UNDELIVERED" }]);
    renderPage();

    // "Retries ran out" is worth retrying by hand; "the supplier said no" is not.
    expect(within(screen.getByRole("table")).getByText("Tidak Terkirim")).toBeInTheDocument();
    expect(screen.queryByText("Ditolak Supplier")).not.toBeInTheDocument();
  });
});
