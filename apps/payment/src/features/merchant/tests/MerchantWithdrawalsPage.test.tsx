import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";

import MerchantWithdrawalsPage from "../pages/MerchantWithdrawalsPage";
import * as hooks from "../hooks/useMerchant";
import { BANK_OPTIONS } from "../constants/bankCodes";

const mockList = (rows: unknown[] = []) =>
  vi.spyOn(hooks, "useMerchantWithdrawals").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantWithdrawals>);

const mockCreate = (mutate = vi.fn()) =>
  vi.spyOn(hooks, "useCreateWithdrawal").mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useCreateWithdrawal>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantWithdrawalsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
  mockCreate();
});

describe("MerchantWithdrawalsPage", () => {
  it("renders the bank picker as a dropdown of every known bank", () => {
    renderPage();

    const select = screen.getByLabelText("Bank");
    expect(select.tagName).toBe("SELECT");
    // One <option> per bank plus the disabled placeholder.
    expect(screen.getAllByRole("option")).toHaveLength(BANK_OPTIONS.length + 1);
    expect(screen.getByRole("option", { name: /Bank Central Asia/i })).toBeInTheDocument();
  });

  it("previews the 1500 + 11% fee and the nett as the amount changes", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "100000" } });

    // fee = 1500 + round(100000 * 0.11) = 12500; nett = 87500.
    expect(screen.getByText("Rp 12.500")).toBeInTheDocument();
    expect(screen.getByText("Rp 87.500")).toBeInTheDocument();
  });
});
