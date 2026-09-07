import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";

const LIST_PATH = "/admin/categories-preview/category-type";

/**
 * Category Type list (product_requirements.md §4.5). Guards the reference's
 * leftovers: a Status column that reads "Active" in one screenshot and
 * "In Process" in another for the same rows (the shadcn demo vocabulary), the
 * "of 9999999 transactions" footer noun, and lorem-ipsum copy. Unlike Sub
 * Category this tab has no parent filter, no checkbox column and no bulk
 * delete — the reference shows none of them.
 */
describe("CategoryTypeListPage", () => {
  it("shows a breadcrumb reflecting the active tab", async () => {
    await renderRoute(LIST_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Type/);
  });

  it("shows the header and a real subcopy", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByRole("heading", { name: "Category Type" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, refresh, and Add Category Type — and no parent filter", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByPlaceholderText("Search category type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Category Type/i })).toBeInTheDocument();
    // Sub Category filters by parent; this tab has no parent to filter by.
    expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
  });

  it("the '+ Add Category Type' button opens the Add Category Type modal", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Category Type/i }));

    expect(await screen.findByRole("dialog", { name: "Add Category Type" })).toBeInTheDocument();
  });

  it("shows the four column headers and no selection checkbox", async () => {
    await renderRoute(LIST_PATH);

    const table = await screen.findByRole("table");
    for (const header of ["No.", "Name", "Voucher", "Status", "Action"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(screen.queryByRole("checkbox", { name: "Select all rows" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select row" })).not.toBeInTheDocument();
  });

  it("renders real mock rows with a clear voucher indicator either way", async () => {
    await renderRoute(LIST_PATH);

    const table = await screen.findByRole("table");
    expect(await within(table).findByRole("cell", { name: "Mobile Game" })).toBeInTheDocument();

    // The Voucher cell is icon/dash only, so its accessible name carries the
    // meaning (.claude/rules/accessibility.md).
    expect(within(table).getAllByRole("cell", { name: "Yes" }).length).toBeGreaterThan(0);
    expect(within(table).getAllByRole("cell", { name: "No" }).length).toBeGreaterThan(0);
  });

  it("uses active/inactive statuses, never the demo dataset's 'In Process'", async () => {
    await renderRoute(LIST_PATH);

    const table = await screen.findByRole("table");
    expect(within(table).getAllByText("active").length).toBeGreaterThan(0);
    expect(screen.queryByText(/In Process/i)).not.toBeInTheDocument();
  });

  it("counts the footer in category types, not transactions", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByText(/of \d+ category types/)).toBeInTheDocument();
    expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/9999999/)).not.toBeInTheDocument();
  });

  it("an active row's menu offers Deactive, Edit Category Type and Delete", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Mobile Game/i }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Deactive", "Edit Category Type", "Delete"]);
  });

  it("an inactive row's menu offers Activate instead of Deactive", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Direct Top Up/i }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Activate", "Edit Category Type", "Delete"]);
  });
});
