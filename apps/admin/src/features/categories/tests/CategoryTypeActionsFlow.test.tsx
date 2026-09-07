import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryTypesService } from "../services/categoryTypes.service";
import { CATEGORY_TYPES } from "@/test/fixtures/category-types.data";

const LIST_PATH = "/admin/categories-preview/category-type";

/** The service holds one mutable session copy of the fixtures, so a spy that
 * calls through would flip a row's status for every later test in this file.
 * Stubbing the resolution keeps each test independent of ordering. */
const stubSetStatus = () =>
  vi.spyOn(categoryTypesService, "setStatus").mockResolvedValue({ ...CATEGORY_TYPES[0], status: "inactive" });

/**
 * The two confirmations (product_requirements.md §4.5). The reference reuses
 * one never-customized dialog for both: the same shadcn "permanently delete
 * your account from our servers" body appears under a delete title *and*
 * under "Are you absolutely sure deactive?". Deleting is irreversible and
 * deactivating is not, so these assert two genuinely different dialogs —
 * different titles, different bodies, different confirm labels, and only the
 * delete one framed as permanent.
 */
describe("CategoryType delete confirmation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens a delete-specific confirmation and does not delete until confirmed", async () => {
    const removeSpy = vi.spyOn(categoryTypesService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Game/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this category type?")).toBeInTheDocument();
    expect(within(dialog).getByText(/permanently delete this category type/)).toBeInTheDocument();
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    // Standardised on "Delete", not the Sub Category reference's "Continue".
    expect(within(dialog).queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("cancelling the delete confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(categoryTypesService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Game/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });
});

describe("CategoryType status confirmation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("frames deactivating as reversible, unlike the delete dialog", async () => {
    const setStatusSpy = stubSetStatus();
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Game/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Deactive" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Deactivate this category type?")).toBeInTheDocument();
    expect(within(dialog).getByText(/reactivate it anytime/i)).toBeInTheDocument();
    // The reversible action must not borrow the delete dialog's framing.
    expect(within(dialog).queryByText(/cannot be undone/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/permanently/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/your account/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(setStatusSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(setStatusSpy).toHaveBeenCalledWith(expect.any(String), "inactive");
  });

  it("offers the reverse wording and direction on an inactive row", async () => {
    const setStatusSpy = stubSetStatus();
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Direct Top Up/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Activate" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Activate this category type?")).toBeInTheDocument();
    expect(setStatusSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Activate" }));

    expect(setStatusSpy).toHaveBeenCalledWith(expect.any(String), "active");
  });

  it("cancelling the status confirmation changes nothing", async () => {
    const setStatusSpy = stubSetStatus();
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Game/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Deactive" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(setStatusSpy).not.toHaveBeenCalled();
  });
});
