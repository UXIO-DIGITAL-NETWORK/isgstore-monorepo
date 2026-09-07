import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InternalWithdrawalsPage from "../pages/InternalWithdrawalsPage";
import * as hooks from "../hooks/useFinance";
import type { Withdrawal } from "@/types/withdrawal.type";
import { mockPayoutBanks } from "@/test/payoutBanks";

const pending: Withdrawal = {
  id: 11,
  withdrawal_number: "WD-internal-1",
  amount: 40000,
  fee: 1665,
  nett: 38335,
  bank_code: "BCA",
  account_number: "1234567890",
  account_name: "Kas Internal",
  account_phone: "081234567890",
  status: "PENDING",
  notes: null,
  approved_at: null,
  disbursement_ref: null,
  failure_reason: null,
  proof_url: null,
  created_at: "2026-08-26T00:00:00.000000Z",
  merchant: null,
  requester: { id: 3, name: "Finance A", email: "financea@kita.id" },
};

const mockList = (rows: Withdrawal[] = []) =>
  vi.spyOn(hooks, "useFinanceWithdrawals").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceWithdrawals>);

const mockBalance = (available = 100000) =>
  vi.spyOn(hooks, "usePlatformBalance").mockReturnValue({
    data: { available },
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.usePlatformBalance>);

const mockCreate = (mutate = vi.fn()) =>
  vi.spyOn(hooks, "useCreateInternalWithdrawal").mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useCreateInternalWithdrawal>);

const approve = vi.fn();
const reject = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockList([pending]);
  mockBalance();
  mockCreate();
  mockPayoutBanks();
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
      <InternalWithdrawalsPage />
    </QueryClientProvider>,
  );

const selectBank = (query: string, exactLabel: string) => {
  const input = screen.getByLabelText("Bank / E-wallet");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  fireEvent.click(screen.getByRole("button", { name: exactLabel }));
};

describe("InternalWithdrawalsPage", () => {
  it("shows the available platform balance", () => {
    mockBalance(250000);
    renderPage();

    expect(screen.getByText("Saldo Platform Tersedia")).toBeInTheDocument();
    expect(screen.getByText("Rp 250.000,00")).toBeInTheDocument();
  });

  it("submits the create form with no merchant field", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    selectBank("central asia", "BCA — Bank Central Asia (BCA)");
    fireEvent.change(screen.getByLabelText("No. Rekening"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Kas Internal" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "081234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan Internal" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ bank_code: "BCA", amount: 50000 }),
        expect.anything(),
      ),
    );
  });

  it("lists a pending internal withdrawal by its requester, not a merchant", () => {
    renderPage();

    expect(screen.getByText("WD-internal-1")).toBeInTheDocument();
    expect(screen.getByText("Finance A")).toBeInTheDocument();
  });

  it("offers the manual approval path, requiring proof before it fires", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Setujui" }));
    await user.click(screen.getByLabelText("Transfer manual"));
    await user.click(screen.getByRole("button", { name: "Setujui & Tandai Selesai" }));

    expect(screen.getByText("Bukti transfer wajib diunggah")).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });
});
