import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";

/**
 * Sub Category list (product_requirements.md §4.5, lines 206-208). Every
 * assertion here guards a template leftover the reference carried over:
 * the "Category › Category" breadcrumb, two columns both labelled "Name",
 * the shadcn demo dataset behind the row menu, and the
 * "of 9999999 transactions" footer copy-pasted from the Transaction feature.
 * Rendered via the unauthenticated preview route, same as every other feature.
 */
describe("SubCategoryListPage", () => {
  it("shows a breadcrumb reflecting the active tab, not 'Category › Category'", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Sub Category/);
    expect(breadcrumb.textContent?.match(/Category/g)).toHaveLength(2); // "Category" + "Sub Category"
  });

  it("shows the header and a real subcopy", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    expect(await screen.findByRole("heading", { name: "Sub Category" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, parent-category filter, refresh, and Add Sub Category", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    expect(await screen.findByPlaceholderText("Search sub categories")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Sub Category/i })).toBeInTheDocument();
  });

  it("the '+ Add Sub Category' button opens the Add Sub Category modal", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview/sub-category");

    await user.click(await screen.findByRole("button", { name: /Add Sub Category/i }));

    expect(await screen.findByRole("dialog", { name: "Add Sub Category" })).toBeInTheDocument();
  });

  it("shows the corrected column headers, with only one column named 'Name'", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    const table = await screen.findByRole("table");
    for (const header of ["No.", "Name", "Currency Name", "Created At", "Status", "Action"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(within(table).getAllByRole("columnheader", { name: "Name" })).toHaveLength(1);
  });

  it("shows real game-related mock rows, not the shadcn demo dataset", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    expect(await screen.findByText("Mobile Legends: Global")).toBeInTheDocument();
    expect(screen.getAllByText("Diamonds").length).toBeGreaterThan(0);
    for (const banned of ["Cover Page", "Table of Contents", "Jamik Tashpulatov", "Reviewer", "Section Type"]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument();
    }
  });

  it("counts the footer in sub categories, not transactions", async () => {
    await renderRoute("/admin/categories-preview/sub-category");

    expect(await screen.findByText(/of \d+ sub categories/)).toBeInTheDocument();
    expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/9999999/)).not.toBeInTheDocument();
  });

  it("a row's action menu shows Edit Sub Category and Delete", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/categories-preview/sub-category");

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Legends: Global/i }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit Sub Category", "Delete"]);
  });
});
