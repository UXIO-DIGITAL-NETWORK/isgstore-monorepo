import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { categoryTypesService } from "../services/categoryTypes.service";

const ADD_PATH = "/admin/categories-preview/category-type/add";

/**
 * Add Category Type form (product_requirements.md §4.5). Two fields only.
 * Every placeholder in the reference is lorem ipsum except the voucher
 * checkbox label and its helper text, which read as deliberately written and
 * are used verbatim.
 */
describe("AddCategoryTypePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the breadcrumb trail for the active tab", async () => {
    await renderRoute(ADD_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Type.*Add Category Type/);
  });

  it("shows the header with a real subcopy, never lorem ipsum", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Add Category Type" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows both fields by label, with a real placeholder hint", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByLabelText("Category Type Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Voucher, Direct Top Up")).toBeInTheDocument();
    expect(screen.getByLabelText("This category type is for vouchers")).toBeInTheDocument();
  });

  it("keeps the deliberately-written checkbox helper text verbatim", async () => {
    await renderRoute(ADD_PATH);

    expect(
      await screen.findByText("Enable if this category type is used for selling vouchers or digital codes."),
    ).toBeInTheDocument();
  });

  it("blocks submit and never calls create when the name is empty", async () => {
    const createSpy = vi.spyOn(categoryTypesService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Category Type Name is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the category type with the voucher flag and returns to the list", async () => {
    const createSpy = vi.spyOn(categoryTypesService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.type(await screen.findByLabelText("Category Type Name"), "Game Voucher");
    await user.click(screen.getByLabelText("This category type is for vouchers"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Game Voucher", is_voucher: true, status: "active" }),
    );
    expect(await screen.findByRole("heading", { name: "Category Type" })).toBeInTheDocument();
    expect(await screen.findByText("Game Voucher")).toBeInTheDocument();
  });
});
