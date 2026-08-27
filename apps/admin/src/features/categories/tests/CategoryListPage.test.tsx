import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoriesService } from "../services/categories.service";

/**
 * List view (product_requirements.md §4.5) — the reference's table columns
 * (Header/Section Type/Status/Target/Limit/Reviewer) are the unrelated
 * shadcn demo dataset; this asserts our real columns instead
 * (Category Name/Category Type/Code / Slug/Status/Actions). Rendered via the
 * unauthenticated preview route, same pattern as every other feature.
 */
describe("CategoryListPage", () => {
  it("resolves /admin/categories-preview with the header and a real subcopy", async () => {
    await renderRoute("/admin/categories-preview");

    expect(await screen.findByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, type filter, refresh, and Add Category", async () => {
    await renderRoute("/admin/categories-preview");

    expect(await screen.findByRole("textbox", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Type Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Category/i })).toBeInTheDocument();
  });

  it("shows the table column headers", async () => {
    await renderRoute("/admin/categories-preview");

    const table = await screen.findByRole("table");
    for (const header of ["Category Name", "Category Type", "Code / Slug", "Status", "Actions"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });

  it("shows at least one real game-related mock row, not shadcn demo content", async () => {
    await renderRoute("/admin/categories-preview");

    expect(await screen.findByText("Mobile Legends")).toBeInTheDocument();
    expect(screen.queryByText("Cover Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Jamik Tashpulatov")).not.toBeInTheDocument();
  });

  it("the '+ Add Category' button opens the Add Category modal", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview");

    await user.click(await screen.findByRole("button", { name: /Add Category/i }));

    expect(await screen.findByRole("dialog", { name: "Add Category" })).toBeInTheDocument();
  });

  it("shows all five tabs, mirroring the real route, without leaking out of preview", async () => {
    await renderRoute("/admin/categories-preview");

    for (const label of ["Category", "Sub Category", "Category Type", "Category Server", "Category Provider"]) {
      const tab = await screen.findByRole("tab", { name: label });
      expect(tab).toHaveAttribute("href", expect.stringMatching(/^\/admin\/categories-preview\//));
    }
  });

  it("a row's action menu shows Edit and Delete", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for Mobile Legends/i });
    await user.click(menuButton);

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
  });

  // The filter used to offer three hardcoded names while sending `?type=`,
  // which the API (which reads `type_id`) ignored outright — so it narrowed
  // nothing, and a type created on the Category Type tab never appeared.
  it("offers every category type the API knows, not a frozen list", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview");

    await user.click(await screen.findByLabelText("Type Category"));

    expect(await screen.findByRole("option", { name: "Direct Top Up" })).toBeInTheDocument();
  });

  it("filters by the type's id, which is what the API actually reads", async () => {
    const listSpy = vi.spyOn(categoriesService, "list");
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview");

    await user.click(await screen.findByLabelText("Type Category"));
    await user.click(await screen.findByRole("option", { name: "Direct Top Up" }));

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ type_id: "4" }));
  });
});
