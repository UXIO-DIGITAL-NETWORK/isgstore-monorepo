import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { productsService } from "../services/products.service";

const PATH = "/admin/products/main/add-bulk";

/** Pick the first live option of a Radix Select by its accessible name. */
async function pickFirst(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(await screen.findByRole("combobox", { name }));
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getAllByRole("option")[0]);
}

describe("MainProductAddBulkPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null, permissions: [] });
    vi.restoreAllMocks();
  });

  it("shows the empty state until a supplier and category are chosen", async () => {
    await renderRoute(PATH);

    expect(await screen.findByRole("heading", { name: "Add Product (Bulk)" })).toBeInTheDocument();
    expect(screen.getByText("Select a supplier and category first.")).toBeInTheDocument();
  });

  it("loads candidate products once supplier and category are set, then saves the selection", async () => {
    const spy = vi.spyOn(productsService, "bulkCreate").mockResolvedValue({ created: 1, skipped: [] });
    const user = userEvent.setup();
    await renderRoute(PATH);

    await screen.findByRole("heading", { name: "Add Product (Bulk)" });
    await pickFirst(user, "Supplier");
    await pickFirst(user, "Category");

    // Unmapped Digiflazz candidate from fakeApi.
    const row = (await screen.findByText("S5")).closest("tr") as HTMLElement;
    await user.click(within(row).getByLabelText("Select S5"));

    await user.click(screen.getByRole("button", { name: /Save \(1\)/ }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    const payload = spy.mock.calls[0][0];
    expect(payload.items).toEqual([expect.objectContaining({ code: "S5", cost: 5100 })]);
  });
});
