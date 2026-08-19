import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";

async function openRowMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
}

/**
 * The row action menu (product_requirements.md §4.6). Every action is wired:
 * Deactive / Digiflazz Update / Show Price / Lock Price go through a confirm
 * dialog, Set Price Limit opens its page, and Delete/Edit are unchanged.
 */
describe("Main Products row actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deactivates the row only after the confirmation is accepted", async () => {
    const spy = vi.spyOn(productsService, "bulkDeactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Deactive" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Deactivate this product?")).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));
    // A single id, from the API row (not a hand-written fixture string).
    expect(spy.mock.calls[0][0]).toEqual([expect.stringMatching(/^\d+$/)]);
  });

  it("confirms a Lock Price and fires it for the single row", async () => {
    const spy = vi.spyOn(productsService, "bulkLockPrice").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Lock Price" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Lock this price?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Lock" }));

    expect(spy.mock.calls[0]?.[0]).toHaveLength(1);
    expect(spy.mock.calls[0]?.[1]).toBe(true);
  });

  it("confirms a Digiflazz Update for the single row", async () => {
    const spy = vi.spyOn(productsService, "bulkDigiflazzUpdate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Digiflazz Update" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Update" }));

    expect(spy.mock.calls[0][0]).toHaveLength(1);
  });

  it("navigates to the Set Price Limit page", async () => {
    // Set Price Limit is a real protected route (not a preview twin), so this
    // one runs authenticated against /admin/products/main.
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
    const user = userEvent.setup();
    await renderRoute("/admin/products/main");

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Set Price Limit" }));

    expect(await screen.findByRole("heading", { name: "Set Price limit" })).toBeInTheDocument();
    useAuthStore.setState({ token: null, permissions: [] });
  });
});
