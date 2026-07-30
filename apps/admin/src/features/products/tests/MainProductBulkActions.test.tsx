import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { productsService } from "../services/products.service";

const LIST_PATH = "/admin/products-preview/main";
const FIRST_ROW = "Weekly Diamond Pass (One Week)";

async function selectTwoRows(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(FIRST_ROW);
  const rowCheckboxes = screen.getAllByRole("checkbox", { name: "Select row" });
  await user.click(rowCheckboxes[0]);
  await user.click(rowCheckboxes[1]);
}

/**
 * The selection action bar (product_requirements.md §4.6) — the reference shows
 * Digiflazz / Logo / Deactive / Delete, each carrying the selected count, and
 * only while rows are selected.
 *
 * Deactivating is a status override, so it goes through the shared
 * confirmation and a toast like delete does (`.claude/rules/rbac-security.md`).
 */
describe("Main Products bulk actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reveals every bulk action, count included, only once rows are selected", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText(FIRST_ROW);
    for (const name of [/^Digiflazz \(/, /^Logo \(/, /^Deactive \(/, /^Delete \(/]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }

    await selectTwoRows(user);

    for (const name of ["Digiflazz (2)", "Logo (2)", "Deactive (2)", "Delete (2)"]) {
      expect(await screen.findByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("deactivates nothing until the confirmation is accepted", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await selectTwoRows(user);
    await user.click(await screen.findByRole("button", { name: "Deactive (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Deactivate 2 products?")).toBeInTheDocument();
    expect(within(dialog).getByText(/hidden from the storefront/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(deactivateSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(deactivateSpy).toHaveBeenCalledTimes(2);
  });

  it("cancelling the confirmation deactivates nothing", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await selectTwoRows(user);
    await user.click(await screen.findByRole("button", { name: "Deactive (2)" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(deactivateSpy).not.toHaveBeenCalled();
  });

  it("marks a single-row deactivation in the singular", async () => {
    vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await screen.findByText(FIRST_ROW);
    await user.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
    await user.click(await screen.findByRole("button", { name: "Deactive (1)" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Deactivate this product?")).toBeInTheDocument();
  });

  it("leaves the rows untouched for the two actions still awaiting a spec", async () => {
    const deactivateSpy = vi.spyOn(productsService, "deactivate").mockResolvedValue(undefined);
    const removeSpy = vi.spyOn(productsService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await selectTwoRows(user);
    await user.click(await screen.findByRole("button", { name: "Digiflazz (2)" }));
    await user.click(await screen.findByRole("button", { name: "Logo (2)" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deactivateSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
