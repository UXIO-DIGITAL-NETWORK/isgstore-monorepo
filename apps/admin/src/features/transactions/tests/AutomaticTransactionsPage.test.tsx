import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { fireEvent, renderRoute, screen, within } from "@/test/test-utils";
import { transactionsService } from "../services/transactions.service";

/**
 * Part 4 — test cases (see product_requirements.md §4.3, revised 2026-07-10):
 *
 * - /transaction-preview (unauthenticated preview route) resolves the
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
  it("resolves /transaction-preview with the header and exact subcopy", async () => {
    await renderRoute("/transaction-preview");

    expect(await screen.findByRole("heading", { name: "Automatic Transaction History" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor all automated transactions that have been processed along with their status and details.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the 3 status pills with exact labels and counts", async () => {
    await renderRoute("/transaction-preview");

    expect(await screen.findByRole("button", { name: "Pending (12)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Partial Refund (32)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Partial Success (8)" })).toBeInTheDocument();
  });

  it("shows all 10 filter bar field labels", async () => {
    await renderRoute("/transaction-preview");

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
    await renderRoute("/transaction-preview");

    const table = await screen.findByRole("table");
    for (const header of ["Invoice No.", "User", "Product", "Cost", "Target", "Status", "Method", "Time", "Action"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });

  it("shows the exact-fidelity row's key content", async () => {
    await renderRoute("/transaction-preview");

    expect(await screen.findByText("ZP2607016UJFJVSHCJ")).toBeInTheDocument();
    expect((await screen.findAllByText("Randy Galang")).length).toBeGreaterThan(0);
    expect(screen.getByText("19 Diamond (17 + 2 Bonus)")).toBeInTheDocument();
    expect((await screen.findAllByText("Mobile Legends Indonesia")).length).toBeGreaterThan(0);
    expect(screen.getByText("Rp 4.752")).toBeInTheDocument();
  });

  it("opens a row's action menu with all 7 items, in order", async () => {
    const user = userEvent.setup();
    await renderRoute("/transaction-preview");

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
    await renderRoute("/transaction-preview");

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
    await renderRoute("/transaction-preview");

    const menuButton = await screen.findByRole("button", { name: /Actions for ZP2607016UJFJVSHCJ/i });
    await user.click(menuButton);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid Invoice Proof file and blocks Save (Zod file validation)", async () => {
    const editSpy = vi.spyOn(transactionsService, "edit");
    const user = userEvent.setup();
    await renderRoute("/transaction-preview");

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
});
