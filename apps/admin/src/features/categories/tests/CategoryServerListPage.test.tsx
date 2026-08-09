import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";

const LIST_PATH = "/admin/categories-preview/category-server";

/**
 * Category Server list (product_requirements.md §4.5, lines 229-233).
 *
 * The reference's tab bar read "Server Category" while its header,
 * breadcrumb, button and add-page all read "Category Server" — §4.5 settles
 * it on "Category Server" everywhere, so the tab-bar assertion below is the
 * point of that test, not incidental.
 *
 * This entity has no status concept, so the absence of a Status column and
 * of a deactivate menu item are asserted explicitly — every sibling tab has
 * both, which makes their absence easy to reintroduce by copy-paste.
 */
describe("CategoryServerListPage", () => {
  it("shows a breadcrumb reflecting the active tab", async () => {
    await renderRoute(LIST_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Server/);
  });

  it("names the tab 'Category Server', agreeing with the page it opens", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByRole("tab", { name: "Category Server" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Server Category" })).not.toBeInTheDocument();
  });

  it("shows the header and a real subcopy", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByRole("heading", { name: "Category Server" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows the toolbar: search, refresh, and Add Category Server", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByPlaceholderText("Search Category Server")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Category Server/i })).toBeInTheDocument();
  });

  it("the '+ Add Category Server' button opens the Add Category Server modal", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Category Server/i }));

    expect(await screen.findByRole("dialog", { name: "Add Category Server" })).toBeInTheDocument();
  });

  it("shows exactly three columns, with no Status column and no selection checkbox", async () => {
    await renderRoute(LIST_PATH);

    const table = await screen.findByRole("table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((header) => header.textContent?.trim());
    expect(headers).toEqual(["No.", "Category Server Name", "Action"]);

    expect(within(table).queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select all rows" })).not.toBeInTheDocument();
  });

  it("renders real mock rows", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByText("Genshin Impact")).toBeInTheDocument();
  });

  it("counts the footer in category servers, not transactions", async () => {
    await renderRoute(LIST_PATH);

    expect(await screen.findByText(/of \d+ category servers/)).toBeInTheDocument();
    expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/9999999/)).not.toBeInTheDocument();
  });

  it("a row's menu offers only Edit and Delete — no deactivate", async () => {
    const user = userEvent.setup();
    await renderRoute(LIST_PATH);

    await user.click(await screen.findByRole("button", { name: /Actions for Genshin Impact/i }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit Category Server", "Delete"]);
  });
});
