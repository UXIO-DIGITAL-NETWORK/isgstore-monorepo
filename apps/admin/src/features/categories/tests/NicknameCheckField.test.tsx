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

function renderField(value: string, onChange = vi.fn()) {
  render(
    <TooltipProvider>
      <NicknameCheckField value={value} onChange={onChange} />
    </TooltipProvider>,
  );
  return onChange;
}

describe("NicknameCheckField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the Digiflazz SKU dropdown for a stored digiflazz: value", () => {
    renderField("digiflazz:mlus");

    expect(screen.getByRole("combobox", { name: "Cek Username" })).toHaveTextContent("Digiflazz cek-username SKU");
    expect(screen.getByRole("combobox", { name: "Digiflazz SKU" })).toBeInTheDocument();
    // Not the URL text box.
    expect(screen.queryByLabelText("Lookup URL")).not.toBeInTheDocument();
  });

  it("renders the URL input for a genuine http(s) value, not the SKU dropdown", () => {
    renderField("https://api.example.com/check?id={user_id}");

    expect(screen.getByLabelText("Lookup URL")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
  });

  it("renders the product dropdown for a product: value", () => {
    renderField("product:5");

    expect(screen.getByRole("combobox", { name: "Cek Username Product" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
  });

  it("shows no secondary control when the value is empty (None)", () => {
    renderField("");

    expect(screen.getByRole("combobox", { name: "Cek Username" })).toHaveTextContent("None (no check)");
    expect(screen.queryByRole("combobox", { name: "Digiflazz SKU" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lookup URL")).not.toBeInTheDocument();
  });

  it("emits digiflazz:{sku} when a SKU is picked", async () => {
    const user = userEvent.setup();
    const onChange = renderField("digiflazz:mlus");

    await user.click(screen.getByRole("combobox", { name: "Digiflazz SKU" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("FREE FIRE — Free Fire"));

    expect(onChange).toHaveBeenCalledWith("digiflazz:ffusername");
  });

  it("resets the stored value when switching to Digiflazz mode from a URL value", async () => {
    const user = userEvent.setup();
    const onChange = renderField("https://api.example.com/check");

    await user.click(screen.getByRole("combobox", { name: "Cek Username" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Digiflazz cek-username SKU"));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
