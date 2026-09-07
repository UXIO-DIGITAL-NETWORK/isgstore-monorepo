import { describe, it, expect, vi, beforeEach } from "vitest";

import { fireEvent, render, screen } from "@/test/test-utils";
import { CopyButton } from "./CopyButton";

/**
 * Cases:
 * - exposes an icon-only button named after what it copies
 * - writes the exact value to the clipboard
 * - renders nothing when there is no value to copy
 */
describe("CopyButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is labelled with what it copies", () => {
    render(
      <CopyButton
        value="INV-123"
        label="invoice number"
      />,
    );

    expect(screen.getByRole("button", { name: "Copy invoice number" })).toBeInTheDocument();
  });

  // fireEvent, not user-event: setup() installs its own clipboard stub and
  // clobbers the navigator.clipboard.writeText spy from setup.ts — same
  // reason FinancialPage.test.tsx does it this way.
  it("writes the exact value to the clipboard", () => {
    render(
      <CopyButton
        value="INV-123"
        label="invoice number"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy invoice number" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("INV-123");
  });

  // Nothing to copy is not the same as an empty clipboard — offering the
  // button at all would be a dead control.
  it("renders nothing without a value", () => {
    const { container } = render(
      <CopyButton
        value={undefined}
        label="invoice number"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
