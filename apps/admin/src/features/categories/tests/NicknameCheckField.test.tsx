import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@/components/ui/tooltip";
import { NicknameCheckField } from "../components/NicknameCheckField";

// The two option hooks hit the network via TanStack Query; stub them so the
// component renders deterministically without a QueryClient/provider.
vi.mock("@/hooks/useProductOptions", () => ({
  useProductOptions: () => ({
    options: [{ value: "product:5", label: "Games — MLBB Cek Username" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCekUsernameSkuOptions", () => ({
  useCekUsernameSkuOptions: () => ({
    options: [
      { value: "digiflazz:mlus", label: "MOBILE LEGENDS — Mobile Legends Cek ID/Username" },
      { value: "digiflazz:ffusername", label: "FREE FIRE — Free Fire" },
    ],
    isLoading: false,
  }),
}));

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

describe("NicknameCheckField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hides the provider selector when the check is disabled", () => {
    renderField({ enabled: false, value: "digiflazz:mlus" });

    expect(screen.getByRole("switch", { name: "Cek Username" })).not.toBeChecked();
    expect(screen.queryByRole("combobox", { name: "Metode Cek" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
  });

  it("shows the Digiflazz SKU dropdown when enabled with a digiflazz: value", () => {
    renderField({ enabled: true, value: "digiflazz:mlus" });

    expect(screen.getByRole("switch", { name: "Cek Username" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Metode Cek" })).toHaveTextContent("Digiflazz cek-username SKU");
    expect(screen.getByRole("combobox", { name: "Digiflazz SKU" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Lookup URL")).not.toBeInTheDocument();
  });

  it("shows the URL input for a genuine http(s) value", () => {
    renderField({ enabled: true, value: "https://api.example.com/check?id={user_id}" });

    expect(screen.getByLabelText("Lookup URL")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
  });

  it("shows the product dropdown for a product: value", () => {
    renderField({ enabled: true, value: "product:5" });

    expect(screen.getByRole("combobox", { name: "Cek Username Product" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
  });

  it("toggling the switch calls onEnabledChange", async () => {
    const user = userEvent.setup();
    const { onEnabledChange } = renderField({ enabled: false, value: "" });

    await user.click(screen.getByRole("switch", { name: "Cek Username" }));

    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("emits digiflazz:{sku} when a SKU is picked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField({ enabled: true, value: "digiflazz:mlus" });

    await user.click(screen.getByRole("combobox", { name: "Digiflazz SKU" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("FREE FIRE — Free Fire"));

    expect(onChange).toHaveBeenCalledWith("digiflazz:ffusername");
  });

  it("hints to pick a provider when enabled with no provider set", () => {
    renderField({ enabled: true, value: "" });

    expect(screen.getByText("Pilih provider agar pengecekan berjalan.")).toBeInTheDocument();
  });
});
