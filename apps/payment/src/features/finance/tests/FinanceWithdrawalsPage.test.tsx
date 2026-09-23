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
  account_phone: "081234567890",
  status: "PENDING",
  notes: null,
  approved_at: null,
  disbursement_ref: null,
  failure_reason: null,
  proof_url: null,
  created_at: "2026-08-11T00:00:00.000000Z",
  merchant: { id: 1, name: "Toko A", email: "a@toko.com" },
};

const settled: Withdrawal = {
  ...pending,
  id: 6,
  withdrawal_number: "WD-settled",
  status: "SETTLED",
  disbursement_ref: "MP-88231",
};

const processing: Withdrawal = {
  ...pending,
  id: 7,
  withdrawal_number: "WD-processing",
  status: "PROCESSING",
};

const failed: Withdrawal = {
  ...pending,
  id: 8,
  withdrawal_number: "WD-failed",
  status: "FAILED",
  failure_reason: "Rekening tidak ditemukan",
};

const mockRows = (rows: Withdrawal[]) =>
  vi.spyOn(hooks, "useFinanceWithdrawals").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceWithdrawals>);

beforeEach(() => {
  vi.clearAllMocks();
  mockRows([pending]);
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

  it("confirms before firing the Monetapay disbursement", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    // The confirm dialog is open; the payout has not fired yet.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Cairkan via payment gateway")).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("approves via Monetapay without any proof upload", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));
    await user.click(screen.getByRole("button", { name: "Setujui & Cairkan via payment gateway" }));

    expect(approve).toHaveBeenCalledWith(
      { id: 5, method: "monetapay", proof: undefined },
      expect.anything(),
    );
  });

  it("shows the disbursement reference for a settled withdrawal", () => {
    mockRows([settled]);
    renderPage();

    expect(screen.getByText("MP-88231")).toBeInTheDocument();
  });

  it("marks an in-flight payout as processing", () => {
    mockRows([processing]);
    renderPage();

    expect(screen.getByText("Memproses…")).toBeInTheDocument();
  });

  it("surfaces the failure reason for a failed payout", () => {
    mockRows([failed]);
    renderPage();

    expect(screen.getByText("Rekening tidak ditemukan")).toBeInTheDocument();
  });
});
