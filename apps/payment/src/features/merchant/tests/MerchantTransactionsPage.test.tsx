import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantTransactionsPage from "../pages/MerchantTransactionsPage";
import * as hooks from "../hooks/useMerchant";
import type { UnifiedTransaction } from "@/types/transaction.type";

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

// Same id as the sale on purpose: ids are unique only within a type.
const bill: UnifiedTransaction = {
  type: "service",
  id: 12,
  invoice_number: "SINV-202608-A1B2C3",
  title: "Digiflazz",
  direction: "out",
  amount: 250000,
  status: "UNPAID",
  payment_channel: null,
  created_at: "2026-08-14T09:12:00+07:00",
};

const mockRows = (rows: UnifiedTransaction[]) =>
  vi.spyOn(hooks, "useMerchantTransactions").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantTransactions>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantTransactionsPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

describe("MerchantTransactionsPage", () => {
  /** The direction has to be unmissable — the two rows mean opposite things. */
  it("signs a sale positive and a service bill negative", () => {
    mockRows([bill, sale]);
    renderPage();

    expect(screen.getByText("+Rp 18.500")).toBeInTheDocument();
    expect(screen.getByText("−Rp 250.000")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows.some((row) => row.textContent?.includes("Penjualan"))).toBe(true);
    expect(rows.some((row) => row.textContent?.includes("Langganan"))).toBe(true);
  });

  it("renders two rows when ids collide across sources", () => {
    mockRows([bill, sale]);
    renderPage();

    expect(screen.getByText("INV-20260813-XY12")).toBeInTheDocument();
    expect(screen.getByText("SINV-202608-A1B2C3")).toBeInTheDocument();
  });

  it("re-queries from page one when the tab changes", async () => {
    const user = userEvent.setup();
    const spy = mockRows([sale]);
    renderPage();

    expect(spy).toHaveBeenCalledWith({ page: 1, per_page: 20, type: "all" });

    await user.click(screen.getByRole("tab", { name: "Langganan Service" }));

    expect(spy).toHaveBeenLastCalledWith({ page: 1, per_page: 20, type: "service" });
  });
});
