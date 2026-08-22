import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitForElementToBeRemoved } from "@testing-library/react";

import { renderRoute, screen, within } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Add Main Products modal from the list and returns the dialog element. */
async function openAdd(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: /Add Main Products/i }));
  await user.click(await screen.findByRole("menuitem", { name: "Manual" }));
  return screen.findByRole("dialog", { name: "Add Main Products" });
}

async function fillRequiredFields(user: User, dialog: HTMLElement, name = "Diamond Top Up 500") {
  await user.type(within(dialog).getByLabelText("Product Name"), name);
  await user.type(within(dialog).getByLabelText("Product Code"), "MLBB-DM-500");
  await user.click(within(dialog).getByRole("combobox", { name: "Category" }));
  await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));
}

async function waitForModalClosed() {
  const dialog = screen.queryByRole("dialog", { name: "Add Main Products" });
  if (dialog) await waitForElementToBeRemoved(dialog);
}

/**
 * Add Main Products form (product_requirements.md §4.6). It is a modal now
 * (create/update no longer navigate to a page), opened from the list's
 * "Add Main Products → Manual".
 */
describe("AddMainProductDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens with a real header, not the reference's placeholder copy", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByRole("heading", { name: "Add Main Products" })).toBeInTheDocument();
    expect(within(dialog).queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "Add Category" })).not.toBeInTheDocument();
  });

  it("shows every section heading with its subcopy", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByRole("heading", { name: "Basic information" })).toBeInTheDocument();
    expect(within(dialog).getByText("Product name, code, access, and tags.")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Media & description" })).toBeInTheDocument();
    expect(within(dialog).getByText("Product logo and description shown on the storefront.")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Pricing & Margin" })).toBeInTheDocument();
    expect(within(dialog).getByText("Cost price and selling price per user segment.")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Product Mix" })).toBeInTheDocument();
    expect(within(dialog).getByText("Combine supplier products into one bundled price.")).toBeInTheDocument();
  });

  it("shows every field by label, with the reference's mislabels corrected", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    for (const label of [
      "Product Name",
      "Nickname Validation",
      "Sub Name",
      "Product Code",
      "Product Access",
      "Product Tag",
      "Category",
      "Sub Category",
      "Product Logo",
      "Description",
      "Points",
      "Discount",
      "Cost Price",
      "Public Price",
      "VIP Price",
      "Reseller Price",
      "Agent Price",
    ]) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }

    expect(within(dialog).queryByText("Category Logo")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Acces$/)).not.toBeInTheDocument();
  });

  it("blocks submit and names every missing required field", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Product Name is required")).toBeInTheDocument();
    expect(within(dialog).getByText("Product Code is required")).toBeInTheDocument();
    expect(within(dialog).getByText("Category is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("loads sub categories for the selected category", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));

    await user.click(within(dialog).getByRole("combobox", { name: "Sub Category" }));
    expect(await screen.findByRole("option", { name: "Mobile Legends: Global" })).toBeInTheDocument();
  });

  it("keeps the Description character count and percentage in sync", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.type(within(dialog).getByLabelText("Description"), "Fourteen chars");

    expect(within(dialog).getByText("14/280 characters")).toBeInTheDocument();
    expect(within(dialog).getByText("5% used")).toBeInTheDocument();
  });

  it("rejects a price that is not a number", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await fillRequiredFields(user, dialog);
    await user.type(within(dialog).getByLabelText("Cost Price"), "12k");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Cost Price must be a number")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("caps the percentage fields at 100", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await fillRequiredFields(user, dialog);
    await user.type(within(dialog).getByLabelText("Discount"), "120");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Discount cannot exceed 100")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("adds and removes Product Mix rows, falling back to the empty state", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByText("No product mix yet.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Add Mix/i }));

    expect(within(dialog).queryByText("No product mix yet.")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "Supplier Product" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Quantity")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Add Mix/i }));
    expect(within(dialog).getAllByLabelText("Quantity")).toHaveLength(2);

    await user.click(within(dialog).getByRole("button", { name: "Remove mix 2" }));
    await user.click(within(dialog).getByRole("button", { name: "Remove mix 1" }));

    expect(within(dialog).getByText("No product mix yet.")).toBeInTheDocument();
  });

  it("requires a supplier product and a quantity once a mix row exists", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await fillRequiredFields(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: /Add Mix/i }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Supplier Product is required")).toBeInTheDocument();
    expect(within(dialog).getByText("Quantity must be at least 1")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("captures pricing and mix without putting them in the payload yet", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await fillRequiredFields(user, dialog, "Diamond Bundle 900");
    await user.type(within(dialog).getByLabelText("Points"), "10");
    await user.type(within(dialog).getByLabelText("Cost Price"), "12000");
    await user.type(within(dialog).getByLabelText("Public Price"), "15000");
    await user.click(within(dialog).getByRole("button", { name: /Add Mix/i }));
    await user.click(within(dialog).getByRole("combobox", { name: "Supplier Product" }));
    await user.click(await screen.findByRole("option", { name: "Uxiotopup — ML 86 Diamond" }));
    await user.type(within(dialog).getByLabelText("Quantity"), "2");

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    const payload = createSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(payload.variants).toEqual([]);
    expect(Object.keys(payload)).not.toContain("points");
    expect(Object.keys(payload)).not.toContain("product_mix");
  });

  it("creates the product with the mapped payload and closes the modal", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await fillRequiredFields(user, dialog);
    await user.type(within(dialog).getByLabelText("Sub Name"), "500 Diamonds");
    await user.click(within(dialog).getByRole("combobox", { name: "Product Access" }));
    await user.click(await screen.findByRole("option", { name: "Reseller" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Product Tag" }));
    await user.click(await screen.findByRole("option", { name: "Popular" }));
    await user.type(within(dialog).getByLabelText("Description"), "Instant top up.");

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Diamond Top Up 500",
        code: "MLBB-DM-500",
        sub_name: "500 Diamonds",
        access: "reseller",
        tag: "popular",
        description: "Instant top up.",
        variants: [],
        category_id: expect.stringMatching(/^\d+$/),
      }),
    );

    // Modal closes on success and the new row shows up in the list behind it.
    await waitForModalClosed();
    expect(await screen.findByText("Diamond Top Up 500")).toBeInTheDocument();
  });

  it("Cancel closes the modal without creating anything", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitForModalClosed();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
