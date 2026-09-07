import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApproveWithdrawalDialog } from "../components/ApproveWithdrawalDialog";
import * as hooks from "../hooks/useFinance";
import type { Withdrawal } from "@/types/withdrawal.type";

const approve = vi.fn();

const withdrawal: Withdrawal = {
  id: 42,
  withdrawal_number: "WD-42",
  amount: 100000,
  fee: 0,
  nett: 100000,
  bank_code: "BCA",
  account_number: "6700519102",
  account_name: "Client Merchant",
  account_phone: "081234567890",
  status: "PENDING",
  notes: null,
  approved_at: null,
  disbursement_ref: null,
  failure_reason: null,
  proof_url: null,
  created_at: "2026-08-19T07:09:00.000000Z",
  merchant: { id: 1, name: "Client Merchant", email: "client@example.com" },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useApproveWithdrawal").mockReturnValue({
    mutate: approve,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useApproveWithdrawal>);
});

describe("ApproveWithdrawalDialog", () => {
  it("shows the payout details before confirming", async () => {
    const user = userEvent.setup();
    render(<ApproveWithdrawalDialog withdrawal={withdrawal} />);

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    expect(screen.getByText("Cairkan via Monetapay")).toBeInTheDocument();
    expect(screen.getByText("BCA · 6700519102")).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("fires the disbursement with only the id — no proof, method is implicit", async () => {
    const user = userEvent.setup();
    render(<ApproveWithdrawalDialog withdrawal={withdrawal} />);

    await user.click(screen.getByRole("button", { name: "Setujui" }));
    await user.click(screen.getByRole("button", { name: "Setujui & Cairkan via Monetapay" }));

    expect(approve).toHaveBeenCalledWith(
      { id: 42, method: "monetapay", proof: undefined },
      expect.anything(),
    );
  });

  it("does not offer a manual option unless allowManual is set", async () => {
    const user = userEvent.setup();
    render(<ApproveWithdrawalDialog withdrawal={withdrawal} />);

    await user.click(screen.getByRole("button", { name: "Setujui" }));

    expect(screen.queryByLabelText("Transfer manual")).not.toBeInTheDocument();
  });

  it("requires a proof file before confirming a manual approval", async () => {
    const user = userEvent.setup();
    render(<ApproveWithdrawalDialog withdrawal={{ ...withdrawal, merchant: undefined, requester: { id: 9, name: "Finance A", email: "a@kita.id" } }} allowManual />);

    await user.click(screen.getByRole("button", { name: "Setujui" }));
    await user.click(screen.getByLabelText("Transfer manual"));
    await user.click(screen.getByRole("button", { name: "Setujui & Tandai Selesai" }));

    expect(screen.getByText("Bukti transfer wajib diunggah")).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("fires a manual approval with the attached proof file", async () => {
    const user = userEvent.setup();
    render(<ApproveWithdrawalDialog withdrawal={withdrawal} allowManual />);

    await user.click(screen.getByRole("button", { name: "Setujui" }));
    await user.click(screen.getByLabelText("Transfer manual"));

    const proof = new File(["x"], "bukti.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Bukti Transfer"), proof);
    await user.click(screen.getByRole("button", { name: "Setujui & Tandai Selesai" }));

    expect(approve).toHaveBeenCalledWith(
      { id: 42, method: "manual", proof },
      expect.anything(),
    );
  });
});
