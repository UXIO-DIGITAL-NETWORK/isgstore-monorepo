import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import FinanceServicesPage from "../pages/FinanceServicesPage";
import * as hooks from "../hooks/useFinance";
import type { Service } from "@/types/service.type";

const base: Service = {
  id: 1,
  code: "uxiotopup",
  name: "Uxiotopup",
  category: "supplier",
  category_label: "Supplier",
  description: null,
  features: [],
  cost_price: 180000,
  selling_price: 250000,
  duration_days: 30,
  is_active: true,
  sort_order: 1,
  created_at: "2026-08-11T00:00:00.000000Z",
  updated_at: "2026-08-11T00:00:00.000000Z",
};

/** Sold below cost — the case the operator most needs to spot. */
const atALoss: Service = {
  ...base,
  id: 2,
  code: "domain",
  name: "Domain",
  cost_price: 220000,
  selling_price: 200000,
};

const mockRows = (rows: Service[]) =>
  vi.spyOn(hooks, "useFinanceServices").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceServices>);

beforeEach(() => {
  vi.clearAllMocks();
  mockRows([base]);
  vi.spyOn(hooks, "useDeleteService").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useDeleteService>);
  vi.spyOn(hooks, "useCreateService").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useCreateService>);
  vi.spyOn(hooks, "useUpdateService").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useUpdateService>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceServicesPage />
    </QueryClientProvider>,
  );

describe("FinanceServicesPage", () => {
  it("heads the cost and selling columns in English", () => {
    renderPage();
    expect(screen.getByRole("columnheader", { name: "Cost Price" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Selling Price" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Margin" })).toBeInTheDocument();
  });

  it("shows both prices and the margin they imply", () => {
    renderPage();
    expect(screen.getByText("Rp 180.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 250.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 70.000")).toBeInTheDocument();
    expect(screen.getByText("28.0%")).toBeInTheDocument();
  });

  it("marks a negative margin as destructive", () => {
    mockRows([atALoss]);
    renderPage();

    const margin = screen.getByText("-Rp 20.000");
    expect(margin).toHaveClass("text-destructive");
    expect(screen.getByText("-10.0%")).toBeInTheDocument();
  });

  it("falls back to zero cost when the API omits it", () => {
    const withoutCost: Service = { ...base };
    delete withoutCost.cost_price;
    mockRows([withoutCost]);
    renderPage();

    const row = screen.getByText("Uxiotopup").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).getByText("Rp 0")).toBeInTheDocument();
    // Whole selling price is margin when we record no cost — so it appears
    // twice on the row, in Selling Price and again in Margin.
    expect(within(row!).getAllByText("Rp 250.000")).toHaveLength(2);
    expect(within(row!).getByText("100.0%")).toBeInTheDocument();
  });
});
