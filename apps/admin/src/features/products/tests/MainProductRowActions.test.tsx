import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";
/** The one fixture row that ships `status: "inactive"`. */
const INACTIVE_ROW = "Diamond Top Up 355";
/** The one fixture row that ships `is_price_locked` and `is_price_hidden`. */
const LOCKED_ROW = "Diamond Top Up 86";

async function openRowMenu(user: ReturnType<typeof userEvent.setup>, row = FIRST_ROW) {
  await user.click(await screen.findByRole("button", { name: `Actions for ${row}` }));
}

/**
 * The row action menu (product_requirements.md §4.6). Every action is wired:
 * Activate/Deactive / Uxiotopup Update / Show Price / Lock Price go through a
 * confirm dialog, Set Price Limit opens its page, and Delete/Edit are unchanged.
 * The lifecycle item's label mirrors the row's Status badge, both directions.
 */
describe("Main Products row actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deactivates an active row only after the confirmation is accepted", async () => {
    const spy = vi.spyOn(productsService, "bulkSetStatus").mockResolvedValue(undefined);
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
    expect(spy.mock.calls[0][1]).toBe(false);
  });

  // The label has to follow the Status column: offering "Deactive" on a row that
  // already reads Inactive is a no-op the admin cannot tell apart from a failure.
  it("offers Activate on an inactive row, and activates it", async () => {
    const spy = vi.spyOn(productsService, "bulkSetStatus").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user, INACTIVE_ROW);
    expect(screen.queryByRole("menuitem", { name: "Deactive" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("menuitem", { name: "Activate" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Activate this product?")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Activate" }));
    expect(spy.mock.calls[0][1]).toBe(true);
  });

  it("offers Deactive, not Activate, on an active row", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    expect(await screen.findByRole("menuitem", { name: "Deactive" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Activate" })).not.toBeInTheDocument();
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

  // Same failure the lifecycle item had: without reading the row, a locked price
  // still offered "Lock Price" and nothing in this menu could ever unlock it.
  it("offers Unlock Price on a locked row, and unlocks it", async () => {
    const spy = vi.spyOn(productsService, "bulkLockPrice").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user, LOCKED_ROW);
    expect(screen.queryByRole("menuitem", { name: "Lock Price" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("menuitem", { name: "Unlock Price" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Unlock this price?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Unlock" }));

    expect(spy.mock.calls[0]?.[1]).toBe(false);
  });

  it("offers Hide Price on a visible row, and Show Price on a hidden one", async () => {
    const spy = vi.spyOn(productsService, "bulkShowPrice").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    // A visible row: the only thing left to do is hide it.
    await openRowMenu(user, LOCKED_ROW);
    await user.click(await screen.findByRole("menuitem", { name: "Show Price" }));
    let dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Show price for this product?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Show" }));
    expect(spy.mock.calls[0]?.[1]).toBe(false);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Hide Price" }));
    dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Hide price for this product?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Hide" }));
    expect(spy.mock.calls[1]?.[1]).toBe(true);
  });

  it("confirms a Uxiotopup Update for the single row", async () => {
    const spy = vi.spyOn(productsService, "bulkUxiotopupUpdate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Uxiotopup Update" }));
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
