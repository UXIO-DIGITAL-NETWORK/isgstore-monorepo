import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { FieldLabel } from "./FieldLabel";
import { TooltipProvider } from "@/components/ui/tooltip";

const renderField = (ui: React.ReactNode) => render(<TooltipProvider>{ui}</TooltipProvider>);

describe("FieldLabel", () => {
  it("renders the label text", () => {
    renderField(<FieldLabel htmlFor="x">Category Code</FieldLabel>);
    expect(screen.getByText("Category Code")).toBeInTheDocument();
  });

  it("shows an info trigger only when a tooltip is provided", () => {
    const { rerender } = renderField(<FieldLabel htmlFor="x">Plain</FieldLabel>);
    expect(screen.queryByRole("button", { name: "More information" })).not.toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <FieldLabel
          htmlFor="x"
          tooltip="Explains the field"
        >
          With hint
        </FieldLabel>
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: "More information" })).toBeInTheDocument();
  });
});
