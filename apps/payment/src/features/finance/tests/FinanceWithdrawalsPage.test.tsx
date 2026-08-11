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
  proof_url: null,
  created_at: "2026-08-11T00:00:00.000000Z",
  merchant: { id: 1, name: "Toko A", email: "a@toko.com" },
};

const settled: Withdrawal = {
  ...pending,
  id: 6,
  withdrawal_number: "WD-settled",
  status: "SETTLED",
  proof_url: "http://localhost/storage/withdrawals/proofs/bukti.jpg",
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

  it("opens the settle dialog instead of approving directly", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    // The dialog is open; approval has not fired yet (proof required first).
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Setujui Penarikan")).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("settles with the uploaded bukti transfer", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    const file = new File(["proof"], "bukti.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Bukti Transfer"), file);
    await user.click(screen.getByRole("button", { name: "Setujui & Kirim Bukti" }));

    expect(approve).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, method: "manual", proof: file }),
      expect.anything(),
    );
  });

  it("shows a proof link for a settled withdrawal", () => {
    mockRows([settled]);
    renderPage();

    const link = screen.getByRole("link", { name: "Lihat Bukti" });
    expect(link).toHaveAttribute("href", settled.proof_url);
    expect(link).toHaveAttribute("target", "_blank");
  });
});
