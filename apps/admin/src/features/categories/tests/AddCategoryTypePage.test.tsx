import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitForElementToBeRemoved } from "@testing-library/react";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryTypesService } from "../services/categoryTypes.service";

const LIST_PATH = "/admin/categories-preview/category-type";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Add Category Type modal from the list and returns the dialog element. */
async function openAdd(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: /Add Category Type/i }));
  return screen.findByRole("dialog", { name: "Add Category Type" });
}

/**
 * Add Category Type form (product_requirements.md §4.5) — a modal now, opened
 * from the list's "+ Add Category Type". Two fields only. Every placeholder in
 * the reference is lorem ipsum except the voucher checkbox label and its
 * helper text, used verbatim.
 */
describe("AddCategoryTypeDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens with a real subcopy, never lorem ipsum", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByRole("heading", { name: "Add Category Type" })).toBeInTheDocument();
    expect(within(dialog).queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows both fields by label, with a real placeholder hint", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByLabelText("Category Type Name")).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("e.g. Voucher, Direct Top Up")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("This category type is for vouchers")).toBeInTheDocument();
  });

  it("keeps the deliberately-written checkbox helper text verbatim", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(
      within(dialog).getByText("Enable if this category type is used for selling vouchers or digital codes."),
    ).toBeInTheDocument();
  });

  it("blocks submit and never calls create when the name is empty", async () => {
    const createSpy = vi.spyOn(categoryTypesService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Category Type Name is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the category type with the voucher flag and closes the modal", async () => {
    const createSpy = vi.spyOn(categoryTypesService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.type(within(dialog).getByLabelText("Category Type Name"), "Game Voucher");
    await user.click(within(dialog).getByLabelText("This category type is for vouchers"));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Game Voucher", is_voucher: true, status: "active" }),
    );
    if (screen.queryByRole("dialog", { name: "Add Category Type" })) await waitForElementToBeRemoved(dialog);
    expect(await screen.findByText("Game Voucher")).toBeInTheDocument();
  });
});
