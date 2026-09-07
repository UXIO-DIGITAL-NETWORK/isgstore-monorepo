import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoriesService } from "../services/categories.service";
import { CATEGORIES } from "@/test/fixtures/categories.data";

const LIST_PATH = "/admin/categories-preview";

// Rows come from the API, which reindexes to numeric ids — the first row is 1.
const FIRST_ID = "1";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Edit Category modal from the first row's action menu. */
async function openEdit(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: `Actions for ${CATEGORIES[0].name}` }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
  return screen.findByRole("dialog", { name: "Edit Category" });
}

describe("EditCategoryDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-fills the form with the existing record", async () => {
    const user = userEvent.setup();
    const dialog = await openEdit(user);

    expect(within(dialog).getByRole("heading", { name: "Edit Category" })).toBeInTheDocument();
    expect(await within(dialog).findByDisplayValue(CATEGORIES[0].name)).toBeInTheDocument();
  });

  /**
   * Regression: the Type select must submit the type *id*, not the display name.
   * Sending the name failed the backend's `exists:category_types,id` with 422.
   */
  it("submits the category type as an id, not its name", async () => {
    const updateSpy = vi.spyOn(categoriesService, "update").mockResolvedValue(CATEGORIES[0]);
    const createSpy = vi.spyOn(categoriesService, "create");
    const user = userEvent.setup();
    const dialog = await openEdit(user);

    const nameInput = await within(dialog).findByLabelText("Category Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Mobile Legends: Bang Bang");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(updateSpy).toHaveBeenCalledWith(
      FIRST_ID,
      expect.objectContaining({ type_id: FIRST_ID, name: "Mobile Legends: Bang Bang" }),
    );
    expect(createSpy).not.toHaveBeenCalled();
  });
});
