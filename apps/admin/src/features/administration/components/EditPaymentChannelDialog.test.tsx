import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen, within } from "@/test/test-utils";
import { EditPaymentChannelDialog } from "./EditPaymentChannelDialog";
import type { PaymentChannel } from "../types/administration.type";

const channel: PaymentChannel = {
  id: "1",
  payment_type: "virtual_account",
  channel_code: "bca_va",
  name: "BCA Virtual Account",
  min_amount: 10000,
  fee_flat: 4000,
  fee_percent: 0,
  sort_order: 0,
  is_active: true,
  is_single_use: false,
  created_at: "2026-07-31",
  updated_at: "2026-07-31",
};

describe("EditPaymentChannelDialog", () => {
  it("prefills the current fee configuration", () => {
    render(
      <EditPaymentChannelDialog
        open
        onOpenChange={vi.fn()}
        channel={channel}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Flat Fee")).toHaveValue(4000);
  });

  it("rejects a percentage above 100 and blocks submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EditPaymentChannelDialog
        open
        onOpenChange={vi.fn()}
        channel={channel}
        onSubmit={onSubmit}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const percent = within(dialog).getByLabelText("Percentage Fee (%)");
    await user.clear(percent);
    await user.type(percent, "150");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Percentage cannot exceed 100")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the updated fee configuration", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EditPaymentChannelDialog
        open
        onOpenChange={vi.fn()}
        channel={channel}
        onSubmit={onSubmit}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const flat = within(dialog).getByLabelText("Flat Fee");
    await user.clear(flat);
    await user.type(flat, "5000");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ fee_flat: 5000, fee_percent: 0, min_amount: 10000 });
  });
});
