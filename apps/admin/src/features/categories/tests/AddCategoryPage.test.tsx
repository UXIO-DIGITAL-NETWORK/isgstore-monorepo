import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { categoriesService } from "../services/categories.service";

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Category Type" }));
  await user.click(await screen.findByRole("option", { name: "Mobile Game" }));
  await user.click(screen.getByRole("combobox", { name: "Category UID Parser" }));
  await user.click(await screen.findByRole("option", { name: "None" }));
  await user.type(screen.getByLabelText("Category Name"), "Wild Rift");
  await user.type(screen.getByLabelText("Category Code"), "WR");
  await user.type(screen.getByLabelText("Category Slug"), "wild-rift");
}

/**
 * Add Category form (product_requirements.md §4.5) — deliberately designed
 * in the reference, followed precisely here. Rendered via the
 * unauthenticated preview route.
 */
describe("AddCategoryPage", () => {
  it("resolves /categories-preview/add with the header", async () => {
    await renderRoute("/categories-preview/add");
    expect(await screen.findByRole("heading", { name: "Add Category" })).toBeInTheDocument();
  });

  it("shows both section headings and their exact subcopies", async () => {
    await renderRoute("/categories-preview/add");

    expect(await screen.findByRole("heading", { name: "Basic information" })).toBeInTheDocument();
    expect(screen.getByText("Type, validation, and category identity on the storefront.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Category form" })).toBeInTheDocument();
    expect(screen.getByText("Input fields shown to buyers when ordering.")).toBeInTheDocument();
  });

  it("shows all eight Basic information fields by label", async () => {
    await renderRoute("/categories-preview/add");

    for (const label of [
      "Category Type",
      "Category UID Parser",
      "Category Name",
      "Category Sub Name",
      "Account Nickname Validation",
      "Region",
      "Category Code",
      "Category Slug",
    ]) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }
  });

  it("shows the field-key guide text verbatim", async () => {
    await renderRoute("/categories-preview/add");

    expect(
      await screen.findByText("Do not use whatsapp or email keys — buyer contact is taken from their account."),
    ).toBeInTheDocument();
    expect(screen.getByText("Suggested keys: user_id, server_id.")).toBeInTheDocument();
  });

  it("shows the empty-forms message before any field is added", async () => {
    await renderRoute("/categories-preview/add");

    expect(await screen.findByText('No forms yet. Click "Add Form" to add one.')).toBeInTheDocument();
  });

  it("clicking '+ Add Form' adds a new field-definition row", async () => {
    const user = userEvent.setup();
    await renderRoute("/categories-preview/add");

    expect(screen.queryByLabelText(/^Key$/i)).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Add Form/i }));

    expect(await screen.findAllByLabelText(/^Key$/i)).toHaveLength(1);
    expect(screen.queryByText('No forms yet. Click "Add Form" to add one.')).not.toBeInTheDocument();
  });

  it("shows validation errors and blocks submit when required fields are empty", async () => {
    const createSpy = vi.spyOn(categoriesService, "create");
    const user = userEvent.setup();
    await renderRoute("/categories-preview/add");

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Category Type is required")).toBeInTheDocument();
    expect(screen.getByText("Category UID Parser is required")).toBeInTheDocument();
    expect(screen.getByText("Category Name is required")).toBeInTheDocument();
    expect(screen.getByText("Category Code is required")).toBeInTheDocument();
    expect(screen.getByText("Category Slug is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the reserved-key message for a whatsapp/email field key", async () => {
    const createSpy = vi.spyOn(categoriesService, "create");
    const user = userEvent.setup();
    await renderRoute("/categories-preview/add");

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /Add Form/i }));
    await user.type(screen.getByLabelText(/^Key$/i), "whatsapp");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Reserved key — buyer contact is taken from their account.")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the category and navigates back to the list with the new row on valid submit", async () => {
    const user = userEvent.setup();
    await renderRoute("/categories-preview/add");

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(await screen.findByText("Wild Rift")).toBeInTheDocument();
  });
});
