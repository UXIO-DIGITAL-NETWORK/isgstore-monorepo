import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { subCategoriesService } from "../services/subCategories.service";

const LIST_PATH = "/admin/categories-preview/sub-category";

/**
 * Delete flow (product_requirements.md §4.5, lines 212-214). The reference's
 * dialog body is shadcn/ui's own AlertDialog documentation example verbatim
 * ("...permanently delete your account from our servers") — it describes
 * deleting a user account, not a taxonomy record. These tests pin the real
 * copy and assert the row menu and the bulk button share one dialog and one
 * mutation, differing only in the set of ids.
 */
describe("SubCategory delete flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the confirmation with singular copy and does not delete until Continue", async () => {
    const removeSpy = vi.spyOn(subCategoriesService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Legends: Global/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this sub category?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this sub category/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Continue" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a bulk Delete (N) button once rows are selected", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText("Mobile Legends: Global");
    expect(screen.queryByRole("button", { name: /^Delete \(/ })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    expect(await screen.findByRole("button", { name: "Delete (1)" })).toBeInTheDocument();

    await user.click(rowCheckboxes[1]);
    expect(await screen.findByRole("button", { name: "Delete (2)" })).toBeInTheDocument();
  });

  it("opens the same confirmation with plural copy for a bulk delete", async () => {
    const removeSpy = vi.spyOn(subCategoriesService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText("Mobile Legends: Global");
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);
    await user.click(await screen.findByRole("button", { name: "Delete (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 sub categories?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete these 2 sub categories/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Continue" }));

    expect(removeSpy).toHaveBeenCalledTimes(2);
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(subCategoriesService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Legends: Global/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
