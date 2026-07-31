import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const ADD_PATH = "/admin/products-preview/main/add";

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, name = "Diamond Top Up 500") {
  await user.type(await screen.findByLabelText("Product Name"), name);
  await user.type(screen.getByLabelText("Product Code"), "MLBB-DM-500");
  await user.click(screen.getByRole("combobox", { name: "Category" }));
  await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));
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

  it("shows both section headings with their subcopies", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Basic information" })).toBeInTheDocument();
    expect(screen.getByText("Product name, code, access, and tags.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Media & description" })).toBeInTheDocument();
    expect(screen.getByText("Product logo and description shown on the storefront.")).toBeInTheDocument();
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

  // Sub categories are fetched per category now, so the list is whatever the
  // API returns for the chosen one rather than a static map.
  it("loads sub categories for the selected category", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));

    await user.click(screen.getByRole("combobox", { name: "Sub Category" }));
    expect(await screen.findByRole("option", { name: "Mobile Legends: Global" })).toBeInTheDocument();
  });

  it("keeps the Description character count and percentage in sync", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    // "Fourteen chars" = 14 chars → 14/280 = 5%.
    await user.type(await screen.findByLabelText("Description"), "Fourteen chars");

    expect(screen.getByText("14/280 characters")).toBeInTheDocument();
    expect(screen.getByText("5% used")).toBeInTheDocument();
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
        sub_name: "500 Diamonds",
        access: "reseller",
        tag: "popular",
        description: "Instant top up.",
        // No pricing fields in this frame, so the product starts with none.
        variants: [],
        // The select submits a real category id — the API's foreign key needs
        // one, and the old hardcoded list carried names.
        category_id: expect.stringMatching(/^\d+$/),
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
