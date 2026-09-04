import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@/components/ui/tooltip";
import { NicknameCheckField } from "../components/NicknameCheckField";

function renderField({ enabled, value }: { enabled: boolean; value: string }) {
  const onChange = vi.fn<(value: string) => void>();
  const onEnabledChange = vi.fn<(enabled: boolean) => void>();
  render(
    <TooltipProvider>
      <NicknameCheckField
        enabled={enabled}
        onEnabledChange={onEnabledChange}
        value={value}
        onChange={onChange}
      />
    </TooltipProvider>,
  );
  return { onChange, onEnabledChange };
}

/**
 * The supplier-side lookup options (product SKU / cek-username SKU) are gone —
 * Uxiolabs has no cek-username API, so the only provider is a third-party
 * lookup URL. The field is now a master switch plus a URL input.
 */
describe("NicknameCheckField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hides the lookup URL when the check is disabled", () => {
    renderField({ enabled: false, value: "https://api.example.com/check?id={user_id}" });

    expect(screen.getByRole("switch", { name: "Cek Username" })).not.toBeChecked();
    expect(screen.queryByLabelText("Lookup URL")).not.toBeInTheDocument();
  });

  it("shows the URL input carrying the stored value when enabled", () => {
    renderField({ enabled: true, value: "https://api.example.com/check?id={user_id}" });

    expect(screen.getByRole("switch", { name: "Cek Username" })).toBeChecked();
    expect(screen.getByLabelText("Lookup URL")).toHaveValue("https://api.example.com/check?id={user_id}");
  });

  it("offers no supplier-SKU or product-based lookup anymore", () => {
    renderField({ enabled: true, value: "" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("toggling the switch calls onEnabledChange", async () => {
    const user = userEvent.setup();
    const { onEnabledChange } = renderField({ enabled: false, value: "" });

    await user.click(screen.getByRole("switch", { name: "Cek Username" }));

    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("typing into the URL input calls onChange", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField({ enabled: true, value: "" });

    await user.type(screen.getByLabelText("Lookup URL"), "h");

    expect(onChange).toHaveBeenCalledWith("h");
  });

  it("hints to pick a provider when enabled with no URL set", () => {
    renderField({ enabled: true, value: "" });

    expect(screen.getByText("Pilih provider agar pengecekan berjalan.")).toBeInTheDocument();
  });
});
