import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";

async function openRowMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: `Actions for ${FIRST_ROW}` }));
}

/**
 * The row action menu (product_requirements.md §4.6). Only Deactive, Edit and
 * Delete have a defined effect; Digiflazz Update, Show Price, Lock Price and
 * Set Price Limit are listed by the reference but nothing specifies what they
 * do, so they must not touch the row (see `.claude/rules/project.md` — never
 * invent business rules).
 */
describe("Main Products row actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deactivates the row only after the confirmation is accepted", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Deactive" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Deactivate this product?")).toBeInTheDocument();
    expect(deactivateSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(deactivateSpy).toHaveBeenCalledWith("prod-1");
  });

  it("cancelling deactivates nothing", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await openRowMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Deactive" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

    expect(deactivateSpy).not.toHaveBeenCalled();
  });

  it("leaves the row untouched for the actions still awaiting a spec", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const removeSpy = vi.spyOn(productsService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    for (const action of ["Digiflazz Update", "Show Price", "Lock Price", "Set Price Limit"]) {
      await openRowMenu(user);
      await user.click(await screen.findByRole("menuitem", { name: action }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    }

    expect(deactivateSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
