import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "@/providers/theme-provider";
import { AddProviderProductDialog } from "../components/AddProviderProductDialog";
import { providerService } from "../services/provider.service";
import type { UxiotopupPriceListItem } from "../types/product.type";

const ITEM: UxiotopupPriceListItem = {
  id: "S5",
  buyer_sku_code: "S5",
  name: "Telkomsel Pulsa 5.000",
  category: "Pulsa",
  cost: 5100,
  harga: 5100,
  harga_gold: 5000,
  harga_silver: 5050,
  harga_pro: 4950,
  available: true,
  already_mapped: false,
};

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AddProviderProductDialog
          item={ITEM}
          open
          onOpenChange={() => {}}
        />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("AddProviderProductDialog", () => {
  it("submits the chosen category, mapped id, and numeric prices", async () => {
    const addSpy = vi.spyOn(providerService, "add").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderDialog();

    // Category is required — pick the first live option (fakeApi seeds categories).
    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getAllByRole("option")[0]);

    // Prices pre-fill from the SKU preview (cost 5100 × 1.2 = 6120 for member).
    await waitFor(() => expect(screen.getByLabelText("Member price")).toHaveValue("6120"));

    await user.click(screen.getByRole("button", { name: "Add product" }));

    await waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));
    const payload = addSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      buyer_sku_code: "S5",
      price_member: 6120,
      status: true,
    });
    expect(payload).not.toHaveProperty("type");
    // A real category id (string) was selected, not the empty default.
    expect(payload.category_id).not.toBe("");
    expect(typeof payload.price_member).toBe("number");
  });

  it("lets the admin set prices by percentage, computing rupiah from cost", async () => {
    const addSpy = vi.spyOn(providerService, "add").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderDialog();

    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getAllByRole("option")[0]);
    await waitFor(() => expect(screen.getByLabelText("Member price")).toHaveValue("6120"));

    // Flip to percentage mode: the member field shows the implied 20% markup
    // (6120 over cost 5100) and previews the resulting rupiah price.
    await user.click(screen.getByRole("switch", { name: "Set price by percentage" }));
    await waitFor(() => expect(screen.getByLabelText("Member markup %")).toHaveValue("20"));
    expect(screen.getByText(/= Rp\s*6.120/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add product" }));

    await waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));
    // The absolute price is recomputed from cost × (1 + %/100) before submit.
    expect(addSpy.mock.calls[0][0].price_member).toBe(6120);
  });

  it("blocks submit until a category is chosen", async () => {
    const addSpy = vi.spyOn(providerService, "add").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderDialog();

    await user.click(await screen.findByRole("button", { name: "Add product" }));

    expect(await screen.findByText("Choose a category")).toBeInTheDocument();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
