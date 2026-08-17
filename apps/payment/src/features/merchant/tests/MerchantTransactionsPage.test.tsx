import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";

import MerchantTransactionsPage from "../pages/MerchantTransactionsPage";
import * as hooks from "../hooks/useMerchant";
import type { TransactionSummary, UnifiedTransaction } from "@/types/transaction.type";

const sale: UnifiedTransaction = {
  type: "sale",
  id: 12,
  invoice_number: "INV-20260813-XY12",
  title: "Mobile Legends 86 Diamond",
  direction: "in",
  amount: 18500,
  status: "COMPLETED",
  payment_channel: "QRIS",
  created_at: "2026-08-13T20:04:00+07:00",
};

const serviceBill: UnifiedTransaction = {
  type: "service",
  id: 5,
  invoice_number: "SINV-202608-AB12",
  title: "Domain",
  direction: "out",
  amount: 200000,
  status: "PAID",
  payment_channel: null,
  created_at: "2026-08-12T09:00:00+07:00",
};

const mockRows = (rows: UnifiedTransaction[]) =>
  vi.spyOn(hooks, "useMerchantTransactions").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantTransactions>);

const mockSummary = (over: Partial<TransactionSummary> = {}) =>
  vi.spyOn(hooks, "useMerchantTransactionSummary").mockReturnValue({
    data: { count_total: 2, count_success: 1, count_pending: 1, count_failed: 0, amount_total: 218500, ...over },
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useMerchantTransactionSummary>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantTransactionsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockSummary();
});

describe("MerchantTransactionsPage", () => {
  it("shows the client's topup sale row", () => {
    mockRows([sale]);
    renderPage();

    expect(screen.getByText("+Rp 18.500")).toBeInTheDocument();
    expect(screen.getByText("INV-20260813-XY12")).toBeInTheDocument();
  });

  it("renders a service bill as an outgoing amount with no method", () => {
    mockRows([serviceBill]);
    renderPage();

    expect(screen.getByText("−Rp 200.000")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("queries the feed with the default filters", () => {
    const spy = mockRows([sale, serviceBill]);
    renderPage();

    expect(spy).toHaveBeenCalledWith({ page: 1, per_page: 20, type: "all" });
  });

  it("renders the status summary pills from the summary endpoint", () => {
    mockRows([sale]);
    mockSummary({ count_success: 3 });
    renderPage();

    expect(screen.getByRole("button", { name: /Sukses/i })).toHaveTextContent("3");
  });

  it("filters the table by bucket when a pill is clicked", () => {
    const spy = mockRows([sale]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Gagal/i }));

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ status_group: "failed", page: 1 }));
  });
});
