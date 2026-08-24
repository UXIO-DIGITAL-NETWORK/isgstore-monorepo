import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitForElementToBeRemoved } from "@testing-library/react";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryProvidersService } from "../services/categoryProviders.service";

const LIST_PATH = "/admin/categories-preview/category-provider";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Add Category Provider modal from the list and returns the dialog element. */
async function openAdd(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: /Add Category Provider/i }));
  return screen.findByRole("dialog", { name: "Add Category Provider" });
}

/**
 * Add Category Provider (product_requirements.md §4.5, lines 243, 247) — a
 * modal now, opened from the list's "+ Add Category Provider". Three selects.
 * The reference's own page header reads "Add Category Server", leftover-label
 * bug #2 from copy-pasting the tab built immediately before this one; every
 * placeholder is lorem ipsum. Both are pinned here.
 */
describe("AddCategoryProviderDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("titles the dialog 'Add Category Provider', not the leftover 'Add Category Server'", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByRole("heading", { name: "Add Category Provider" })).toBeInTheDocument();
    expect(within(dialog).queryByText("Add Category Server")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("shows all three fields by label, with real placeholder hints", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByLabelText("Provider")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Category")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Provider Category")).toBeInTheDocument();

    for (const hint of ["Select a provider", "Select a category", "Select a provider first"]) {
      expect(within(dialog).getByText(hint)).toBeInTheDocument();
    }
  });

  it("blocks save until every field is chosen", async () => {
    const createSpy = vi.spyOn(categoryProvidersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Provider is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("saves the chosen provider, category and provider category", async () => {
    const createSpy = vi.spyOn(categoryProvidersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Uxiotopup" }));

    await user.click(within(dialog).getByLabelText("Category"));
    await user.click(await screen.findByRole("option", { name: "Genshin Impact" }));

    await user.click(within(dialog).getByLabelText("Provider Category"));
    await user.click(await screen.findByRole("option", { name: /Valorant/ }));

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith({
      // The select submits the API's supplier_id, not the display name.
      supplier_id: expect.stringMatching(/^\d+$/),
      category_id: expect.stringMatching(/^\d+$/),
      provider_category: "Valorant",
    });
  });

  it("groups the provider's catalogue by category, once each, with its SKU counts", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Uxiotopup" }));
    await user.click(within(dialog).getByLabelText("Provider Category"));

    // Two Valorant SKUs upstream (one inactive) collapse into a single option.
    const valorant = await screen.findAllByRole("option", { name: /Valorant/ });
    expect(valorant).toHaveLength(1);
    expect(valorant[0]).toHaveTextContent("1 of 2 SKUs active");
  });

  it("marks an already-mapped provider category as added and blocks picking it twice", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Uxiotopup" }));
    await user.click(within(dialog).getByLabelText("Provider Category"));

    expect(await screen.findByText("Already added")).toBeInTheDocument();

    // "Mobile Legends" is already mapped by a fixtured Category Provider, so it
    // is listed for context but cannot be chosen again.
    const mapped = await screen.findByRole("option", { name: /Mobile Legends/ });
    expect(mapped).toHaveTextContent("already mapped to");
    expect(mapped).toHaveAttribute("aria-disabled", "true");
  });

  it("cannot map a provider that has no catalogue integration", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "Zelpoint" }));

    expect(within(dialog).getByLabelText("Provider Category")).toBeDisabled();
    expect(
      within(dialog).getByText(/Only Uxiotopup exposes a catalogue today/i),
    ).toBeInTheDocument();
  });

  it("Cancel closes the modal without saving", async () => {
    const createSpy = vi.spyOn(categoryProvidersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    if (screen.queryByRole("dialog", { name: "Add Category Provider" })) await waitForElementToBeRemoved(dialog);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
