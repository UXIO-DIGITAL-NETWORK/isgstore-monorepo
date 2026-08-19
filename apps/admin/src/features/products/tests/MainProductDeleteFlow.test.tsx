import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";

/**
 * Delete flow. Deletion is unreachable except through the shared confirmation;
 * both the row menu and the bulk menu go through the same `bulkDelete` endpoint
 * (the row passes a one-id selection).
 */
describe("Main Products delete flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the confirmation with singular copy and does not delete until confirmed", async () => {
    const spy = vi.spyOn(productsService, "bulkDelete").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this product?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this product/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(spy.mock.calls[0][0]).toHaveLength(1);
  });

  it("deletes the selection through the bulk menu with plural copy", async () => {
    const spy = vi.spyOn(productsService, "bulkDelete").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText(FIRST_ROW);
    expect(screen.queryByRole("button", { name: /items selected/ })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);

    await user.click(await screen.findByRole("button", { name: /2 items selected/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete 2 products?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete these 2 products/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(spy.mock.calls[0][0]).toHaveLength(2);
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const spy = vi.spyOn(productsService, "bulkDelete").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

    expect(spy).not.toHaveBeenCalled();
  });
});
