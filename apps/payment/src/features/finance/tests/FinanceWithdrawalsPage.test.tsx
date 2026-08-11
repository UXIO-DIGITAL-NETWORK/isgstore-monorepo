import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import FinanceWithdrawalsPage from "../pages/FinanceWithdrawalsPage";
import * as hooks from "../hooks/useFinance";
import type { Withdrawal } from "@/types/withdrawal.type";

const approve = vi.fn();
const reject = vi.fn();

const pending: Withdrawal = {
  id: 5,
  withdrawal_number: "WD-xyz",
  amount: 40000,
  fee: 0,
  nett: 40000,
  bank_code: "BCA",
  account_number: "123",
  account_name: "Toko",
  status: "PENDING",
  notes: null,
  approved_at: null,
  disbursement_ref: null,
  created_at: "2026-08-11T00:00:00.000000Z",
  merchant: { id: 1, name: "Toko A", email: "a@toko.com" },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useFinanceWithdrawals").mockReturnValue({
    data: { rows: [pending], page: 1, lastPage: 1, total: 1, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceWithdrawals>);
  vi.spyOn(hooks, "useApproveWithdrawal").mockReturnValue({
    mutate: approve,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useApproveWithdrawal>);
  vi.spyOn(hooks, "useRejectWithdrawal").mockReturnValue({
    mutate: reject,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useRejectWithdrawal>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceWithdrawalsPage />
    </QueryClientProvider>,
  );

describe("FinanceWithdrawalsPage", () => {
  it("lists a pending withdrawal with its merchant", () => {
    renderPage();
    expect(screen.getByText("WD-xyz")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
  });

  it("approves a pending withdrawal", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    expect(approve).toHaveBeenCalledWith({ id: 5, method: "manual" });
  });
});
