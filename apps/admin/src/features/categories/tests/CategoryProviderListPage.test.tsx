import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryProvidersService } from "../services/categoryProviders.service";

const LIST_PATH = "/admin/categories-preview/category-provider";

/**
 * Category Provider list (product_requirements.md §4.5, lines 239-246) — the
 * fifth and last tab. Assertions here guard the two confirmed leftover labels
 * copy-pasted from the Category Server tab built immediately before it (the
 * toolbar button reading "+ Add Category Server"), the recurring
 * "of 9999999 transactions" footer noun, and the absence of a Status column /
 * deactivate item that this reference genuinely does not have.
 */
describe("CategoryProviderListPage", () => {
  it("shows a breadcrumb reflecting the active tab", async () => {
    await renderRoute(LIST_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Provider/);
  });

  it("shows the header and a real subcopy", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByRole("heading", { name: "Category Provider" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Provisional/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, provider filter, refresh, and the add button", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByPlaceholderText("Search category provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("labels the add button 'Add Category Provider', not the leftover 'Add Category Server'", async () => {
    await renderRoute(LIST_PATH);

    // §4.5 line 243: leftover-label bug #1, copy-pasted from the Category
    // Server tab. Asserting the wrong label is *absent* is the point — a
    // present-only check would pass on a page showing both.
    expect(await screen.findByRole("button", { name: /Add Category Provider/i })).toBeInTheDocument();
    expect(screen.queryByText(/Add Category Server/i)).not.toBeInTheDocument();
  });

  it("the add button opens the Add Category Provider modal", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Category Provider/i }));

    expect(await screen.findByRole("dialog", { name: "Add Category Provider" })).toBeInTheDocument();
  });

  it("shows the five columns, with no Status column", async () => {
    await renderRoute(LIST_PATH);

    const table = await screen.findByRole("table");
    for (const header of ["No.", "Provider", "Category", "Provider Category", "Created At", "Action"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(within(table).queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
  });

  it("shows real supplier names and resolves each row's category to a real Category", async () => {
    await renderRoute(LIST_PATH);

    // The same supplier names already fixtured in financial/integration
    // (§4.5 line 239) — not invented ones, and not the shadcn demo dataset.
    expect(await screen.findByText("Uxiolabs")).toBeInTheDocument();
    expect(screen.getAllByText("Zelpoint").length).toBeGreaterThan(0);
    // The provider's own category string, reconciled against its live catalogue.
    expect(screen.getAllByText("Mobile Legends").length).toBeGreaterThan(0);
    expect(screen.getByText("1 of 1 SKUs active")).toBeInTheDocument();
    for (const banned of ["Cover Page", "Table of Contents", "Jamik Tashpulatov", "Reviewer"]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument();
    }
  });

  it("counts the footer in category providers, not transactions", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByText(/of \d+ category providers/)).toBeInTheDocument();
    expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/9999999/)).not.toBeInTheDocument();
  });

  it("a row's action menu shows exactly Edit Category Provider and Delete", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Uxiolabs/i }));

    // Exactly two: no deactivate/activate, since this entity has no status.
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit Category Provider", "Delete"]);
  });

  // The filter used to send the provider's *name* as a free-text `search`,
  // which also matched provider_category and the category name — so picking a
  // provider quietly widened the result set. The API exposes an exact
  // supplier_id filter; use it.
  it("filters by an exact supplier id rather than a name search", async () => {
    const listSpy = vi.spyOn(categoryProvidersService, "list");
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Zelpoint" }));

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ supplier_id: "2" }));
    expect(listSpy).not.toHaveBeenCalledWith(expect.objectContaining({ provider_name: "Zelpoint" }));
  });
});
