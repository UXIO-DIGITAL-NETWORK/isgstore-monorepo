import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ChannelFeePage from "../pages/ChannelFeePage";
import * as hooks from "../hooks/useFinance";
import type { ChannelFee } from "../types/finance.type";

const mandiriVa: ChannelFee = {
  id: 4,
  name: "Mandiri Virtual Account",
  channel_code: "mandiri_va",
  payment_type: "virtual_account",
  min_amount: 10000,
  fee_flat: 0,
  fee_percent: 0,
  gateway_fee_flat: 1900,
  gateway_fee_percent: 0,
  is_active: true,
};

const qris: ChannelFee = {
  id: 9,
  name: "QRIS",
  channel_code: "qris",
  payment_type: "qris",
  min_amount: 1000,
  fee_flat: 0,
  fee_percent: 0.7,
  gateway_fee_flat: 0,
  gateway_fee_percent: 0.7,
  is_active: true,
};

const save = vi.fn();

const mockList = (rows: ChannelFee[] = [mandiriVa]) =>
  vi.spyOn(hooks, "useChannelFees").mockReturnValue({
    data: rows,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useChannelFees>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChannelFeePage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
  vi.spyOn(hooks, "useUpdateChannelFee").mockReturnValue({
    mutate: save,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useUpdateChannelFee>);
});

describe("ChannelFeePage", () => {
  it("renders the flat gateway fee and saves an edit to it", () => {
    renderPage();

    // The "Fee Gateway (Rp)" input shows the channel's flat gateway fee.
    const input = screen.getByDisplayValue("1900");
    fireEvent.change(input, { target: { value: "2000" } });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 4, payload: expect.objectContaining({ gateway_fee_flat: 2000 }) }),
    );
  });

  it("exposes the simulation controls and computes tax on the QRIS fee", () => {
    mockList([qris]);
    renderPage();

    // Simulation controls default to 60.000 nominal and 11% PPN.
    expect(screen.getByLabelText(/Nominal simulasi/i)).toHaveValue(60000);
    expect(screen.getByLabelText(/Tarif Pajak/i)).toHaveValue(11);

    // QRIS at 60.000: fee 420, PPN 11% → 46, profit 420 − 423 − 46 = −49.
    const row = screen.getByText("QRIS").closest("tr")!;
    expect(within(row).getByText("Rp 420")).toBeInTheDocument();
    expect(within(row).getByText("Rp 46")).toBeInTheDocument();
    expect(within(row).getByText(/-\s?Rp\s?49/)).toBeInTheDocument();
  });

  it("recomputes the columns when the simulation nominal changes", () => {
    mockList([qris]);
    renderPage();

    fireEvent.change(screen.getByLabelText(/Nominal simulasi/i), { target: { value: "100000" } });

    const row = screen.getByText("QRIS").closest("tr")!;
    // fee = 0,7% of 100.000 = 700; tax = 11% of 700 = 77.
    expect(within(row).getByText("Rp 700")).toBeInTheDocument();
    expect(within(row).getByText("Rp 77")).toBeInTheDocument();
  });

  it("totals tax and profit across active channels only", () => {
    mockList([qris, mandiriVa]);
    renderPage();

    // Total tax = QRIS 46 + Mandiri 0 = 46 (only QRIS carries a percent fee).
    expect(screen.getByText(/Total Pajak/i)).toBeInTheDocument();
    const totalTax = screen.getByText(/Total Pajak/i).closest<HTMLElement>("[data-testid='sim-total']")!;
    expect(within(totalTax).getByText("Rp 46")).toBeInTheDocument();
  });
});
