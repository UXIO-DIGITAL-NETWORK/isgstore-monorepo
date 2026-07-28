import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { categoryProvidersService } from "../services/categoryProviders.service";

const ADD_PATH = "/admin/categories-preview/category-provider/add";

/**
 * Add Category Provider (product_requirements.md §4.5, lines 243, 247) —
 * three selects. The reference's own page header reads "Add Category Server",
 * leftover-label bug #2 from copy-pasting the tab built immediately before
 * this one; every placeholder is lorem ipsum. Both are pinned here.
 */
describe("AddCategoryProviderPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a breadcrumb ending in Add Category Provider", async () => {
    await renderRoute(ADD_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Provider.*Add Category Provider/);
  });

  it("titles the page 'Add Category Provider', not the leftover 'Add Category Server'", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Add Category Provider" })).toBeInTheDocument();
    expect(screen.queryByText("Add Category Server")).not.toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows all three fields by label, with real placeholder hints", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByLabelText("Provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider Template")).toBeInTheDocument();

    for (const hint of ["Select a provider", "Select a category", "Select a template"]) {
      expect(screen.getByText(hint)).toBeInTheDocument();
    }
  });

  it("blocks save until every field is chosen", async () => {
    const createSpy = vi.spyOn(categoryProvidersService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Provider is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("saves the chosen provider, category and template", async () => {
    const createSpy = vi.spyOn(categoryProvidersService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Zelpoint" }));

    await user.click(screen.getByLabelText("Category"));
    await user.click(await screen.findByRole("option", { name: "Genshin Impact" }));

    await user.click(screen.getByLabelText("Provider Template"));
    await user.click(await screen.findByRole("option", { name: "Games-Mobile Legends" }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith({
      provider_name: "Zelpoint",
      category_id: "cat-3",
      provider_template: "Games-Mobile Legends",
    });
  });

  it("Cancel returns to the list without saving", async () => {
    await renderRoute(ADD_PATH);

    const cancel = await screen.findByRole("link", { name: "Cancel" });
    expect(cancel).toHaveAttribute("href", "/admin/categories-preview/category-provider");
  });
});
