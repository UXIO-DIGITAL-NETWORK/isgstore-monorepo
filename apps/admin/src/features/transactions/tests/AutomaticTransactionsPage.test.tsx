import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { fireEvent, renderRoute, screen, within } from "@/test/test-utils";
import { TRANSACTIONS } from "../data/transactions.data";
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
 * - "Edit Invoice" NAVIGATES to the Edit Transaction page with its 4 fields
 *   (product_requirements.md §4.3, revised 2026-07-13 — was a modal).
 * - "Delete" opens a confirmation dialog BEFORE any delete mutation fires.
 *
 * Activity Log modal (product_requirements.md §4.3, confirmed 2026-07-13):
 * - "Activity Log" opens a dialog with the corrected subcopy, the 5 column
 *   headers, and that transaction's real fixture entries.
 * - Automated ("System") entries render distinctly from operator entries.
 */
describe("AutomaticTransactionsPage", () => {
  // The page defaults its date filter to today (commit 11e4238), so without a
  // pinned clock this suite silently depends on the real calendar — the
  // exact-fidelity Jul 1 fixture row drops out of every assertion below.
  // Only Date is faked; setTimeout/setInterval stay real so user-event and
  // React Query behave normally.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("navigates to the Edit Transaction page with its 4 fields on Edit Invoice", async () => {
    const user = userEvent.setup();
    const { router } = await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Edit Invoice" }));

    // The row's own invoice drives the URL, and it's a real route now — the
    // list is gone from the DOM rather than sitting behind an overlay.
    expect(await screen.findByRole("heading", { name: "Edit Transaction" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/admin/transaction-preview/ZP2607016UJFJVSHCJ/edit");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    for (const label of ["Status Payment", "Invoice Status", "Serial Number", "Invoice Proof"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("opens the Activity Log dialog with its subcopy, 5 headers, and that row's real entries", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Activity Log" }));

    const dialog = await screen.findByRole("dialog", { name: "Activity Log" });
    expect(
      within(dialog).getByText("A record of every status change and action taken on this transaction."),
    ).toBeInTheDocument();

    // Scoped to the dialog: the parent table also has "User" and "Action"
    // column headers, so an unscoped query would match two nodes.
    for (const header of ["No.", "User", "Action", "Description", "Time"]) {
      expect(within(dialog).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }

    // Real logged content, not just "a table rendered" — the actual fixture
    // entries for txn-1, whose descriptions are event details rather than
    // the product/target values the reference image repeated.
    const log = TRANSACTIONS[0].activity_log;
    expect(await within(dialog).findByText("Invoice Created")).toBeInTheDocument();
    expect(within(dialog).getByText("Status Changed")).toBeInTheDocument();
    for (const entry of log) {
      expect(within(dialog).getByText(entry.description)).toBeInTheDocument();
    }
  });

  it("shows the parent row's own customer in the User column, on every entry", async () => {
    // txn-2, dated Jul 2, so the clock moves a day forward BEFORE render —
    // the page seeds its date filter from `new Date()` in a useState
    // initializer. Its customer differs from txn-1's, which is the point:
    // the User column must follow the transaction the modal was opened from.
    vi.setSystemTime(new Date("2026-07-02T12:00:00.000Z"));
    const user = userEvent.setup();
    await renderRoute("/admin/transaction-preview");

    const transaction = TRANSACTIONS[1];
    const { name, phone } = transaction.customer;

    await user.click(
      await screen.findByRole("button", { name: new RegExp(`Actions for ${transaction.invoice_no}`, "i") }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Activity Log" }));

    const dialog = await screen.findByRole("dialog", { name: "Activity Log" });
    // One name + one phone per entry — never the other row's customer, and
    // never a "System" placeholder.
    const entryCount = transaction.activity_log.length;
    expect((await within(dialog).findAllByText(name)).length).toBe(entryCount);
    expect(within(dialog).getAllByText(phone).length).toBe(entryCount);
    expect(within(dialog).queryByText("System")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(TRANSACTIONS[0].customer.name)).not.toBeInTheDocument();
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

    const fileInput = await screen.findByLabelText("Invoice Proof");
    const invalidFile = new File(["not-an-image"], "proof.pdf", { type: "application/pdf" });
    // fireEvent (not user-event) here: the file input is visually hidden
    // behind the "Browse files" button, and user-event's upload() no-ops on
    // it rather than setting `files` + firing change — same hidden-input
    // caveat already documented in FinancialPage.test.tsx for the clipboard
    // stub.
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Only JPG, JPEG, or PNG files are allowed")).toBeInTheDocument();
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

    // Cleared before exercising the header checkbox: the default date filter
    // narrows the page to a single day, and with one row still selected the
    // header is already in its all-checked state, so clicking it would
    // deselect rather than select.
    await user.click(rowCheckboxes[0]);
    expect(rowCheckboxes[0]).not.toBeChecked();

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
