import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { subCategoriesService } from "../services/subCategories.service";

const ADD_PATH = "/admin/categories-preview/sub-category/add";

/**
 * Add Sub Category form (product_requirements.md §4.5, line 210). Guards the
 * reference's leftovers: lorem-ipsum placeholders, the unfilled "~000×000 px"
 * dropzone caption, and the "0/280 characters" counter shown next to a
 * mismatched "52% used" — the same non-functional mock already fixed on the
 * Category form's SEO section.
 */
describe("AddSubCategoryPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the breadcrumb trail for the active tab", async () => {
    await renderRoute(ADD_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Sub Category.*Add Sub Category/);
  });

  it("shows the header with a real subcopy, never lorem ipsum", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Add Sub Category" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows every field by label with a real placeholder hint", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("combobox", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sub Category Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Currency Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Logo")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();

    expect(screen.getByText("Select a category")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Mobile Legends: Global")).toBeInTheDocument();
  });

  it("accepts WEBP alongside JPG/JPEG/PNG and states a real max display size", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByText(/JPG, JPEG, PNG, WEBP up to 10mb/)).toBeInTheDocument();
    expect(screen.getByText(/800×600 px/)).toBeInTheDocument();
    expect(screen.queryByText(/000×000/)).not.toBeInTheDocument();
  });

  it("derives the description counter percentage from the actual character count", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    expect(await screen.findByText("0/280 characters")).toBeInTheDocument();
    expect(screen.getByText("0% used")).toBeInTheDocument();
    expect(screen.queryByText("52% used")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Description"), "Fourteen chars");

    expect(await screen.findByText("14/280 characters")).toBeInTheDocument();
    expect(screen.getByText("5% used")).toBeInTheDocument();
  });

  it("blocks submit and never calls create when required fields are empty", async () => {
    const createSpy = vi.spyOn(subCategoriesService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Category is required")).toBeInTheDocument();
    expect(screen.getByText("Sub Category Name is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the sub category and returns to the list on a valid submit", async () => {
    const createSpy = vi.spyOn(subCategoriesService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));
    await user.type(screen.getByLabelText("Sub Category Name"), "Mobile Legends: Philippines");
    await user.type(screen.getByLabelText("Currency Name"), "Diamonds");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "cat-1",
        name: "Mobile Legends: Philippines",
        currency_name: "Diamonds",
        status: "active",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Sub Category" })).toBeInTheDocument();
    expect(await screen.findByText("Mobile Legends: Philippines")).toBeInTheDocument();
  });
});
