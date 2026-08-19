import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
