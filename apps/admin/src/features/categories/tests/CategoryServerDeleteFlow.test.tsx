import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryServersService } from "../services/categoryServers.service";

const LIST_PATH = "/admin/categories-preview/category-server";

/**
 * Delete flow (product_requirements.md §4.5). The reference shows shadcn's
 * "…permanently delete your account from our servers" body for the fourth
 * time across this feature's tabs — this tab reuses the shared
 * DeleteConfirmDialog rather than repeating the correction.
 */
describe("CategoryServer delete flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the shared confirmation with category-server copy and waits for confirmation", async () => {
    const removeSpy = vi.spyOn(categoryServersService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Genshin Impact/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this category server?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this category server/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(categoryServersService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Genshin Impact/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
