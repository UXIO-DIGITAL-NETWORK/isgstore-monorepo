import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const ADD_PATH = "/admin/products-preview/main/add";

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, name = "Diamond Top Up 500") {
  await user.type(await screen.findByLabelText("Product Name"), name);
  await user.type(screen.getByLabelText("Product Code"), "MLBB-DM-500");
  await user.click(screen.getByRole("combobox", { name: "Category" }));
  await user.click(await screen.findByRole("option", { name: "Mobile Legends: Indonesia" }));
}

/**
 * Add Main Products form (product_requirements.md §4.6). Rendered through the
 * unauthenticated preview twin, like every other form page test.
 *
 * The reference frame is a copy-paste hybrid of Add Category — its header says
 * "Add Category", its logo field says "Category Logo", and "Access" is
 * misspelled "Acces". Those corrections are pinned here so they can't drift
 * back, the same way the lorem-ipsum and "9999999" corrections are.
 */
describe("AddMainProductPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the Add route with a real header, not the reference's placeholder copy", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Add Main Products" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add Category" })).not.toBeInTheDocument();
  });

  it("shows every section heading with its subcopy", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Basic information" })).toBeInTheDocument();
    expect(screen.getByText("Product name, code, access, and tags.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Media & description" })).toBeInTheDocument();
    expect(screen.getByText("Product logo and description shown on the storefront.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Pricing & Margin" })).toBeInTheDocument();
    expect(screen.getByText("Cost price and selling price per user segment.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Product Mix" })).toBeInTheDocument();
    expect(screen.getByText("Combine supplier products into one bundled price.")).toBeInTheDocument();
  });

  it("shows every field by label, with the reference's mislabels corrected", async () => {
    await renderRoute(ADD_PATH);

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
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }

    // The frame labels the dropzone "Category Logo" and misspells "Acces".
    expect(screen.queryByText("Category Logo")).not.toBeInTheDocument();
    expect(screen.queryByText(/Acces$/)).not.toBeInTheDocument();
  });

  it("blocks submit and names every missing required field", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Product Name is required")).toBeInTheDocument();
    expect(screen.getByText("Product Code is required")).toBeInTheDocument();
    expect(screen.getByText("Category is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("lists only the selected category's sub categories, and clears them when it changes", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Mobile Legends: Indonesia" }));

    await user.click(screen.getByRole("combobox", { name: "Sub Category" }));
    expect(await screen.findByRole("option", { name: "Starlight" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Genesis Crystals" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Starlight" }));
    expect(screen.getByRole("combobox", { name: "Sub Category" })).toHaveTextContent("Starlight");

    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Genshin Impact" }));

    expect(screen.getByRole("combobox", { name: "Sub Category" })).not.toHaveTextContent("Starlight");
    await user.click(screen.getByRole("combobox", { name: "Sub Category" }));
    expect(await screen.findByRole("option", { name: "Genesis Crystals" })).toBeInTheDocument();
  });

  it("keeps the Description character count and percentage in sync", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    // "Fourteen chars" = 14 chars → 14/280 = 5%.
    await user.type(await screen.findByLabelText("Description"), "Fourteen chars");

    expect(screen.getByText("14/280 characters")).toBeInTheDocument();
    expect(screen.getByText("5% used")).toBeInTheDocument();
  });

  it("rejects a price that is not a number", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText("Cost Price"), "12k");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Cost Price must be a number")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("caps the percentage fields at 100", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText("Discount"), "120");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Discount cannot exceed 100")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("adds and removes Product Mix rows, falling back to the empty state", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    expect(await screen.findByText("No product mix yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add Mix/i }));

    expect(screen.queryByText("No product mix yet.")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Supplier Product" })).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add Mix/i }));
    expect(screen.getAllByLabelText("Quantity")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Remove mix 2" }));
    await user.click(screen.getByRole("button", { name: "Remove mix 1" }));

    expect(screen.getByText("No product mix yet.")).toBeInTheDocument();
  });

  it("requires a supplier product and a quantity once a mix row exists", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /Add Mix/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Supplier Product is required")).toBeInTheDocument();
    expect(screen.getByText("Quantity must be at least 1")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("captures pricing and mix without putting them in the payload yet", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    // Its own name: `productsService` keeps one in-memory list across tests,
    // and the created row shows up in the list this navigates back to.
    await fillRequiredFields(user, "Diamond Bundle 900");
    await user.type(screen.getByLabelText("Points"), "10");
    await user.type(screen.getByLabelText("Cost Price"), "12000");
    await user.type(screen.getByLabelText("Public Price"), "15000");
    await user.click(screen.getByRole("button", { name: /Add Mix/i }));
    await user.click(screen.getByRole("combobox", { name: "Supplier Product" }));
    await user.click(await screen.findByRole("option", { name: "Digiflazz — ML 86 Diamond" }));
    await user.type(screen.getByLabelText("Quantity"), "2");

    await user.click(screen.getByRole("button", { name: "Save" }));

    // The entity has nowhere to put these yet (§6 has no points/discount and no
    // mix), so the form captures them and the payload stays as it was.
    const payload = createSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(payload.variants).toEqual([]);
    expect(Object.keys(payload)).not.toContain("points");
    expect(Object.keys(payload)).not.toContain("product_mix");
  });

  it("creates the product with the mapped payload and returns to the list", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText("Sub Name"), "500 Diamonds");
    await user.click(screen.getByRole("combobox", { name: "Product Access" }));
    await user.click(await screen.findByRole("option", { name: "Reseller" }));
    await user.click(screen.getByRole("combobox", { name: "Product Tag" }));
    await user.click(await screen.findByRole("option", { name: "Popular" }));
    await user.type(screen.getByLabelText("Description"), "Instant top up.");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Diamond Top Up 500",
        code: "MLBB-DM-500",
        category_name: "Mobile Legends: Indonesia",
        sub_name: "500 Diamonds",
        access: "reseller",
        tag: "popular",
        description: "Instant top up.",
        // No pricing fields in this frame, so the product starts with none.
        variants: [],
        // Denormalized off the chosen category, since the form has no Game field.
        game_id: "game-mlbb",
        game_name: "Mobile Legends: Bang Bang",
      }),
    );

    expect(await screen.findByRole("heading", { name: "Main Products" })).toBeInTheDocument();
    expect(await screen.findByText("Diamond Top Up 500")).toBeInTheDocument();
  });

  it("Cancel returns to the list without creating anything", async () => {
    const createSpy = vi.spyOn(productsService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("link", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { name: "Main Products" })).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
