import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { subCategoriesService } from "../services/subCategories.service";
import { SUB_CATEGORIES } from "@/test/fixtures/sub-categories.data";

const LIST_PATH = "/admin/categories-preview/sub-category";

// Rows come from the API now, which assigns numeric ids — the fixtures are
// seeded in order, so the first row is id 1.
const FIRST_ID = "1";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Edit Sub Category modal from the first row's action menu. */
async function openEdit(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: `Actions for ${SUB_CATEGORIES[0].name}` }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit Sub Category" }));
  return screen.findByRole("dialog", { name: "Edit Sub Category" });
}

/**
 * Edit Sub Category (product_requirements.md §4.5, line 210) — the same form
 * pre-filled, as a modal now, opened from the row action menu.
 */
describe("EditSubCategoryDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-fills the form with the existing record", async () => {
    const user = userEvent.setup();
    const dialog = await openEdit(user);

    expect(within(dialog).getByRole("heading", { name: "Edit Sub Category" })).toBeInTheDocument();
    expect(await within(dialog).findByDisplayValue(SUB_CATEGORIES[0].name)).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue(SUB_CATEGORIES[0].currency_name)).toBeInTheDocument();
  });

  it("submits as an update, not a create", async () => {
    const updateSpy = vi.spyOn(subCategoriesService, "update");
    const createSpy = vi.spyOn(subCategoriesService, "create");
    const user = userEvent.setup();
    const dialog = await openEdit(user);

    const nameInput = await within(dialog).findByLabelText("Sub Category Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Mobile Legends: SEA");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(updateSpy).toHaveBeenCalledWith(
      FIRST_ID,
      expect.objectContaining({ name: "Mobile Legends: SEA" }),
    );
    expect(createSpy).not.toHaveBeenCalled();
  });
});
