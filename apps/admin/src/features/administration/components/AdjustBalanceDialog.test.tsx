import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen, within } from "@/test/test-utils";
import { AdjustBalanceDialog } from "./AdjustBalanceDialog";

describe("AdjustBalanceDialog", () => {
  const setup = () => {
    const onConfirm = vi.fn();
    render(
      <AdjustBalanceDialog
        open
        onOpenChange={vi.fn()}
        userName="Randy Galang"
        onConfirm={onConfirm}
      />,
    );
    return { onConfirm };
  };

  it("blocks submit when the reason is empty", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Amount"), "50000");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));

    expect(await within(dialog).findByText("A reason is required")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("blocks submit when the amount is not positive", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Amount"), "0");
    await user.type(within(dialog).getByLabelText("Reason"), "test");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));

    expect(await within(dialog).findByText("Amount must be greater than zero")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("submits a credit adjustment with amount, direction and trimmed reason", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Amount"), "50000");
    await user.type(within(dialog).getByLabelText("Reason"), "  compensation  ");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));

    expect(onConfirm).toHaveBeenCalledWith({ amount: 50000, direction: "credit", reason: "compensation" });
  });
});
