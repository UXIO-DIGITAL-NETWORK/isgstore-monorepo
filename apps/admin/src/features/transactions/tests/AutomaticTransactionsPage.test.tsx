import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { fireEvent, renderRoute, screen, within } from "@/test/test-utils";
import { transactionsService } from "../services/transactions.service";

/**
 * Part 4 — test cases (see product_requirements.md §4.3, revised 2026-07-10):
 *
 * - /admin/transaction-preview (unauthenticated preview route) resolves the
 *   Automatic Transaction History page: header + exact subcopy.
 * - The 3 status pills render with their exact labels and counts (12/32/8).
 * - The filter bar's 10 field labels are present.
 * - The table's 9 column headers are present.
 * - The exact-fidelity fixture row's key content renders (invoice no,
 *   customer name, product, game, formatted cost).
 * - Opening a row's action menu shows all 7 items, in order.
 * - "Edit Invoice" opens the Edit Transaction dialog with its 4 fields.
 * - "Delete" opens a confirmation dialog BEFORE any delete mutation fires.
 */
describe("AutomaticTransactionsPage", () => {
  it("resolves /admin/transaction-preview with the header and exact subcopy", async () => {
    await renderRoute("/admin/transaction-preview");

    expect(await screen.findByRole("heading", { name: "Automatic Transaction History" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor all automated transactions that have been processed along with their status and details.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the 3 status pills with exact labels and counts", async () => {
    await renderRoute("/admin/transaction-preview");

    // Pills are now full-width stat-card buttons with the label and count as
    // separate elements (matching the reference's visual layout), rather
    // than a single "Label (count)" text node — assert both are present
    // within each button rather than an exact accessible name.
    const pending = await screen.findByRole("button", { name: /Pending/ });
    expect(within(pending).getByText("12")).toBeInTheDocument();

    const partialRefund = screen.getByRole("button", { name: /Partial Refund/ });
    expect(within(partialRefund).getByText("32")).toBeInTheDocument();

    const partialSuccess = screen.getByRole("button", { name: /Partial Success/ });
    expect(within(partialSuccess).getByText("8")).toBeInTheDocument();
  });

  it("shows all 10 filter bar field labels", async () => {
    await renderRoute("/admin/transaction-preview");

    // Scoped to the filter bar's landmark: the sidebar also has an unrelated
    // "Search" trigger, so an unscoped query would match more than one node.
    const filterBar = await screen.findByRole("region", { name: "Transaction Filters" });
    for (const label of [
      "Search",
      "User",
      "Category",
      "Product",
      "Invoice Status",
      "Payment Status",
      "Start Date",
      "End Date",
      "Invoice From",
      "Payment Method",
    ]) {
      expect(within(filterBar).getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the table column headers", async () => {
    await renderRoute("/admin/transaction-preview");

    const table = await screen.findByRole("table");
    for (const header of ["Invoice No.", "User", "Product", "Cost", "Target", "Status", "Method", "Time", "Action"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });

  it("shows the exact-fidelity row's key content", async () => {
    await renderRoute("/admin/transaction-preview");

    expect(await screen.findByText("ZP2607016UJFJVSHCJ")).toBeInTheDocument();
    expect((await screen.findAllByText("Randy Galang")).length).toBeGreaterThan(0);
    expect(screen.getByText("19 Diamond (17 + 2 Bonus)")).toBeInTheDocument();
    expect((await screen.findAllByText("Mobile Legends Indonesia")).length).toBeGreaterThan(0);
    expect(screen.getByText("Rp 4.752")).toBeInTheDocument();
  });

  it("opens a row's action menu with all 7 items, in order", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Activity Log",
      "Resend Callback",
      "Retry Invoice",
      "View Invoice",
      "Transaction Detail",
      "Edit Invoice",
      "Delete",
    ]);
  });

  it("opens the Edit Transaction dialog with its 4 fields on Edit Invoice", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Edit Invoice" }));

    const dialog = await screen.findByRole("dialog", { name: "Edit Transaction" });
    expect(within(dialog).getByLabelText("Status Payment")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Invoice Status")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Serial Number")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Invoice Proof")).toBeInTheDocument();
  });

  it("opens a confirmation dialog before calling the delete service on Delete", async () => {
    const removeSpy = vi.spyOn(transactionsService, "remove");
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid Invoice Proof file and blocks Save (Zod file validation)", async () => {
    const editSpy = vi.spyOn(transactionsService, "edit");
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Edit Invoice" }));

    const dialog = await screen.findByRole("dialog", { name: "Edit Transaction" });
    const fileInput = within(dialog).getByLabelText("Invoice Proof");
    const invalidFile = new File(["not-an-image"], "proof.pdf", { type: "application/pdf" });
    // fireEvent (not user-event) here: the file input is visually hidden
    // behind the "Browse files" button, and user-event's upload() no-ops on
    // it rather than setting `files` + firing change — same hidden-input
    // caveat already documented in FinancialPage.test.tsx for the clipboard
    // stub.
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Only JPG, JPEG, or PNG files are allowed")).toBeInTheDocument();
    expect(editSpy).not.toHaveBeenCalled();
  });

  it("selects all rows via the header checkbox, and a single row via its own checkbox", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const selectAll = await screen.findByRole("checkbox", { name: "Select all rows" });
    const rowCheckboxes = await screen.findAllByRole("checkbox", { name: "Select row" });
    expect(rowCheckboxes.length).toBeGreaterThan(0);
    expect(rowCheckboxes[0]).not.toBeChecked();

    await user.click(rowCheckboxes[0]);
    expect(rowCheckboxes[0]).toBeChecked();

    await user.click(selectAll);
    for (const checkbox of rowCheckboxes) expect(checkbox).toBeChecked();
  });

  it("clicking a sortable column header re-queries the service with real sort params", async () => {
    const listSpy = vi.spyOn(transactionsService, "list");
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    await screen.findByText("ZP2607016UJFJVSHCJ");
    listSpy.mockClear();

    await user.click(await screen.findByRole("button", { name: "Cost" }));

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ sortBy: "cost", sortDir: "asc" }));
  });

  it("shows a row number column instead of a drag handle", async () => {
    await renderRoute("/admin/transaction-preview");

    await screen.findByText("ZP2607016UJFJVSHCJ");
    expect(screen.getByRole("columnheader", { name: "#" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drag to reorder row" })).not.toBeInTheDocument();
  });
});
