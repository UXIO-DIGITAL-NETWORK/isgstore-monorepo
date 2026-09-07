import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen, within } from "@/test/test-utils";
import { RefundDialog } from "./RefundDialog";

/**
 * Component contract for the Refund confirmation gate (product_requirements.md
 * §4.3): the reason is mandatory, `onConfirm` never fires on open, and when it
 * does fire it carries the trimmed reason.
 */
describe("RefundDialog", () => {
  const setup = () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RefundDialog
        open
        onOpenChange={onOpenChange}
        invoiceNo="INV-001"
        onConfirm={onConfirm}
      />,
    );
    return { onConfirm, onOpenChange };
  };

  it("does not call onConfirm on open", () => {
    const { onConfirm } = setup();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("blocks submit and shows an error when the reason is empty", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Refund" }));

    expect(await within(dialog).findByText("A refund reason is required")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm with the trimmed reason and closes on valid submit", async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = setup();

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Reason"), "  Supplier out of stock  ");
    await user.click(within(dialog).getByRole("button", { name: "Refund" }));

    expect(onConfirm).toHaveBeenCalledWith("Supplier out of stock");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
