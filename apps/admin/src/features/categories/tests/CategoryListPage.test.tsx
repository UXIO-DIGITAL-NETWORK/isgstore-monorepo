import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";

/**
 * List view (product_requirements.md §4.5) — the reference's table columns
 * (Header/Section Type/Status/Target/Limit/Reviewer) are the unrelated
 * shadcn demo dataset; this asserts our real columns instead
 * (Category Name/Category Type/Code / Slug/Status/Actions). Rendered via the
 * unauthenticated preview route, same pattern as every other feature.
 */
describe("CategoryListPage", () => {
  it("resolves /categories-preview with the header and a real subcopy", async () => {
    await renderRoute("/categories-preview");

    expect(await screen.findByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, type filter, refresh, and Add Category", async () => {
    await renderRoute("/categories-preview");

    expect(await screen.findByRole("textbox", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Type Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add Category/i })).toBeInTheDocument();
  });

  it("shows the table column headers", async () => {
    await renderRoute("/categories-preview");

    const table = await screen.findByRole("table");
    for (const header of ["Category Name", "Category Type", "Code / Slug", "Status", "Actions"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });

  it("shows at least one real game-related mock row, not shadcn demo content", async () => {
    await renderRoute("/categories-preview");

    expect(await screen.findByText("Mobile Legends")).toBeInTheDocument();
    expect(screen.queryByText("Cover Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Jamik Tashpulatov")).not.toBeInTheDocument();
  });

  it("the '+ Add Category' link navigates relative to the current tab (stays in preview)", async () => {
    await renderRoute("/categories-preview");

    const addLink = await screen.findByRole("link", { name: /Add Category/i });
    expect(addLink).toHaveAttribute("href", "/categories-preview/add");
  });

  it("a row's action menu shows Edit and Delete", async () => {
    const user = userEvent.setup();
    await renderRoute("/categories-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for Mobile Legends/i });
    await user.click(menuButton);

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
  });
});
