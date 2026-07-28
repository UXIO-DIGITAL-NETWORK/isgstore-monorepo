import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";

/**
 * Delete flow. Deletion must be unreachable except through the shared
 * confirmation, and the dialog must never carry shadcn/ui's own
 * "...permanently delete your account from our servers" example copy — the
 * defect confirmed in five consecutive Category references.
 */
describe("Main Products delete flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the confirmation with singular copy and does not delete until confirmed", async () => {
    const removeSpy = vi.spyOn(productsService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this product?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this product/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a bulk Delete (N) button once rows are selected", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText(FIRST_ROW);
    expect(screen.queryByRole("button", { name: /^Delete \(/ })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    expect(await screen.findByRole("button", { name: "Delete (1)" })).toBeInTheDocument();

    await user.click(rowCheckboxes[1]);
    expect(await screen.findByRole("button", { name: "Delete (2)" })).toBeInTheDocument();
  });

  it("opens the same confirmation with plural copy for a bulk delete", async () => {
    const removeSpy = vi.spyOn(productsService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText(FIRST_ROW);
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);
    await user.click(await screen.findByRole("button", { name: "Delete (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 products?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete these 2 products/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(2);
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(productsService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
