import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, waitFor } from "@/test/test-utils";
import { transactionsService } from "../services/transactions.service";

const EDIT_PATH = "/admin/transaction-preview/ZP2607016UJFJVSHCJ/edit";

/**
 * Part 4 — test cases (product_requirements.md §4.3, revised 2026-07-13:
 * Edit Transaction moved from a modal to a dedicated route):
 *
 * - The preview's mirrored edit route resolves with NO auth state, so the
 *   page stays reachable for design review like every other preview screen.
 * - Header card: "Edit Transaction" + real subcopy (the reference's
 *   "Lorem Ipsum Dolor Sit Amet." is placeholder, not copy).
 * - All 4 fields render, prefilled from the transaction in the URL, with
 *   Serial Number as a plain text input (the reference renders it as a
 *   select showing the literal word "Text" — a template artifact, flagged
 *   twice now across two independent references).
 * - Save is disabled while the mutation is pending.
 * - Success navigates back to the list; failure stays on the page.
 * - Cancel returns to the list without mutating.
 */
describe("EditTransactionPage", () => {
  // Same pinned clock as AutomaticTransactionsPage.test.tsx: navigating back
  // to the list mounts a date filter seeded from `new Date()`, so the real
  // calendar would otherwise leak into these assertions.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    // Load-bearing: vitest.config.ts sets no restoreMocks, and the pending-state
    // test replaces `edit` with a promise that never settles — without this it
    // leaks into every test after it and they hang instead of navigating.
    vi.restoreAllMocks();
  });

  it("resolves the preview's edit route with no auth state", async () => {
    await renderRoute(EDIT_PATH);

    expect(await screen.findByRole("heading", { name: "Edit Transaction" })).toBeInTheDocument();
    expect(
      screen.getByText("Update the payment and invoice status for this transaction, or attach proof of settlement."),
    ).toBeInTheDocument();
  });

  it("reads 'Transaction › Automatic › Edit Transaction' in the breadcrumb", async () => {
    await renderRoute(EDIT_PATH);

    await screen.findByRole("heading", { name: "Edit Transaction" });
    const breadcrumb = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Transaction.*Automatic.*Edit Transaction/);
  });

  it("shows all 4 fields, with Serial Number as a text input rather than a select", async () => {
    await renderRoute(EDIT_PATH);

    for (const label of ["Status Payment", "Invoice Status", "Serial Number", "Invoice Proof"]) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }

    const serialNumber = await screen.findByLabelText("Serial Number");
    expect(serialNumber).toHaveAttribute("type", "text");
    expect(serialNumber.tagName).toBe("INPUT");
  });

  it("prefills both status selects from the transaction in the URL", async () => {
    await renderRoute(EDIT_PATH);

    // Fixture txn-1 is success/success — the page must load the row the
    // route param names, not a blank form.
    expect(await screen.findByRole("combobox", { name: "Status Payment" })).toHaveTextContent("Success");
    expect(screen.getByRole("combobox", { name: "Invoice Status" })).toHaveTextContent("Success");
  });

  it("disables Save while the mutation is pending", async () => {
    // Never settles, so the pending state is observable without racing.
    vi.spyOn(transactionsService, "edit").mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    await renderRoute(EDIT_PATH);

    const save = await screen.findByRole("button", { name: "Save" });
    expect(save).toBeEnabled();

    await user.click(save);

    expect(await screen.findByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("navigates back to the transaction list on a successful save", async () => {
    const user = userEvent.setup();
    const { router } = await renderRoute(EDIT_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByRole("heading", { name: "Automatic Transaction History" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/admin/transaction-preview");
  });

  it("stays on the page when the save fails", async () => {
    vi.spyOn(transactionsService, "edit").mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    const { router } = await renderRoute(EDIT_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    expect(screen.getByRole("heading", { name: "Edit Transaction" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(EDIT_PATH);
  });

  it("returns to the list on Cancel without mutating", async () => {
    const editSpy = vi.spyOn(transactionsService, "edit");
    const user = userEvent.setup();
    const { router } = await renderRoute(EDIT_PATH);

    await user.click(await screen.findByRole("link", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { name: "Automatic Transaction History" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/admin/transaction-preview");
    expect(editSpy).not.toHaveBeenCalled();
  });
});
