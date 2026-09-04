import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryProvidersService } from "../services/categoryProviders.service";

const LIST_PATH = "/admin/categories-preview/category-provider";

/**
 * Delete flow (product_requirements.md §4.5, lines 245, 251). The reference's
 * dialog body is shadcn/ui's own AlertDialog example verbatim ("...permanently
 * delete your account from our servers") for the **fifth** time — one shared,
 * never-customized dialog in the source design. These tests pin the real copy
 * and assert the row menu and the bulk button share one dialog and one
 * mutation, differing only in the set of ids.
 */
describe("CategoryProvider delete flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the confirmation with singular copy and does not delete until confirmed", async () => {
    const removeSpy = vi.spyOn(categoryProvidersService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Uxiolabs/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this category provider?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this category provider/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a bulk Delete (N) button once rows are selected", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText("Uxiolabs");
    expect(screen.queryByRole("button", { name: /^Delete \(/ })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    expect(await screen.findByRole("button", { name: "Delete (1)" })).toBeInTheDocument();

    await user.click(rowCheckboxes[1]);
    expect(await screen.findByRole("button", { name: "Delete (2)" })).toBeInTheDocument();
  });

  it("opens the same confirmation with plural copy for a bulk delete", async () => {
    const removeSpy = vi.spyOn(categoryProvidersService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText("Uxiolabs");
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);
    await user.click(await screen.findByRole("button", { name: "Delete (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 category providers?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete these 2 category providers/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(2);
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(categoryProvidersService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Uxiolabs/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
