import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { subCategoriesService } from "../services/subCategories.service";
import { SUB_CATEGORIES } from "../data/sub-categories.data";

const EDIT_PATH = `/admin/categories-preview/sub-category/${SUB_CATEGORIES[0].id}/edit`;

/**
 * Edit Sub Category (product_requirements.md §4.5, line 210) — the same form
 * pre-filled, as a page rather than a modal, consistent with how Transaction's
 * own edit flow was converted from a modal to a route.
 */
describe("EditSubCategoryPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the breadcrumb trail for the active tab", async () => {
    await renderRoute(EDIT_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Sub Category.*Edit Sub Category/);
  });

  it("pre-fills the form with the existing record", async () => {
    await renderRoute(EDIT_PATH);

    expect(await screen.findByRole("heading", { name: "Edit Sub Category" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue(SUB_CATEGORIES[0].name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(SUB_CATEGORIES[0].currency_name)).toBeInTheDocument();
  });

  it("submits as an update, not a create", async () => {
    const updateSpy = vi.spyOn(subCategoriesService, "update");
    const createSpy = vi.spyOn(subCategoriesService, "create");
    const user = userEvent.setup();
    await renderRoute(EDIT_PATH);

    const nameInput = await screen.findByLabelText("Sub Category Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Mobile Legends: SEA");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateSpy).toHaveBeenCalledWith(
      SUB_CATEGORIES[0].id,
      expect.objectContaining({ name: "Mobile Legends: SEA" }),
    );
    expect(createSpy).not.toHaveBeenCalled();
  });
});
