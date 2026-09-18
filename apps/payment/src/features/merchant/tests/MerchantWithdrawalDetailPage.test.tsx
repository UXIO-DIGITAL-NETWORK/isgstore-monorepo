import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import MerchantWithdrawalDetailPage from "../pages/MerchantWithdrawalDetailPage";
import * as hooks from "../hooks/useMerchant";
import type { Withdrawal } from "@/types/withdrawal.type";

vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const withdrawal = (over: Partial<Withdrawal> = {}): Withdrawal => ({
  id: 1,
  withdrawal_number: "WD-abc123",
  amount: 500000,
  fee: 1665,
  nett: 498335,
  bank_code: "BCA",
  account_number: "1234567890",
  account_name: "Toko Jaya",
  account_phone: "081234567890",
  status: "PENDING",
  notes: null,
  approved_at: null,
  disbursement_ref: null,
  failure_reason: null,
  proof_url: null,
  created_at: "2026-08-14T10:00:00+07:00",
  ...over,
});

const renderPage = (data: Withdrawal) => {
  vi.spyOn(hooks, "useMerchantWithdrawal").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantWithdrawal>);

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantWithdrawalDetailPage number={data.withdrawal_number} />
    </QueryClientProvider>,
  );
};

beforeEach(() => vi.clearAllMocks());

describe("MerchantWithdrawalDetailPage", () => {
  it("shows what was requested, what it costs, and what lands", () => {
    renderPage(withdrawal());

    expect(screen.getByText("Rp 500.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.665")).toBeInTheDocument();
    expect(screen.getByText("Rp 498.335")).toBeInTheDocument();
  });

  /** The reason this page exists: WHERE the money is being sent. */
  it("shows the destination account in full", () => {
    renderPage(withdrawal());

    expect(screen.getByText("BCA")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Toko Jaya")).toBeInTheDocument();
    expect(screen.getByText("081234567890")).toBeInTheDocument();
  });

  it("omits the account number for an e-wallet payout", () => {
    renderPage(withdrawal({ bank_code: "GOPAY", account_number: null }));

    expect(screen.getByText("GOPAY")).toBeInTheDocument();
    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
  });

  /**
   * The client reads words, not our enum: "SETTLED" on its own does not say
   * whether the money arrived.
   */
  it("labels the status instead of printing the enum", () => {
    renderPage(withdrawal({ status: "SETTLED" }));

    expect(screen.queryByText("SETTLED")).not.toBeInTheDocument();
    expect(screen.getByText("Dana sudah masuk ke rekening tujuan.")).toBeInTheDocument();
  });

  /** Who is acting, and what happens next — the question a status alone cannot answer. */
  it("explains the step the payout is sitting on", () => {
    renderPage(withdrawal({ status: "PENDING" }));

    expect(screen.getByText("Permintaanmu sudah masuk dan sedang menunggu kami periksa.")).toBeInTheDocument();
  });

  it("carries the reason a payout failed, and a way to try again", () => {
    renderPage(
      withdrawal({
        status: "FAILED",
        disbursement_ref: "DSB-1",
        failure_reason: "Rekening tujuan tidak ditemukan",
      }),
    );

    expect(screen.getByText("Rekening tujuan tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByText("Saldo tidak berkurang karena penarikan ini tidak sampai.")).toBeInTheDocument();
    expect(screen.queryByText("FAILED")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajukan penarikan baru" })).toHaveAttribute(
      "href",
      "/app/payment-admin/withdrawals",
    );
  });

  /**
   * Only a gateway failure carries a reason. A rejection does not, so it must
   * not borrow the gateway's sentence — it says who ended it.
   */
  it("does not blame the bank for a rejection", () => {
    renderPage(withdrawal({ status: "REJECTED" }));

    expect(screen.getByText(/kami tolak/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bank atau gateway tidak memberi alasan/i)).not.toBeInTheDocument();
  });

  it("links the transfer proof once the payout has one", () => {
    renderPage(
      withdrawal({
        status: "SETTLED",
        approved_at: "2026-08-14T11:00:00+07:00",
        proof_url: "https://cdn.example/transfer.jpg",
      }),
    );

    expect(screen.getByRole("link", { name: "Lihat bukti transfer" })).toHaveAttribute(
      "href",
      "https://cdn.example/transfer.jpg",
    );
  });
});
