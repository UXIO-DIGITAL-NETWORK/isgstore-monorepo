import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitForElementToBeRemoved } from "@testing-library/react";

import { renderRoute, screen, within } from "@/test/test-utils";
import { categoryServersService } from "../services/categoryServers.service";

const LIST_PATH = "/admin/categories-preview/category-server";

type User = ReturnType<typeof userEvent.setup>;

/** Opens the Add Category Server modal from the list and returns the dialog element. */
async function openAdd(user: User): Promise<HTMLElement> {
  await renderRoute(LIST_PATH);
  await user.click(await screen.findByRole("button", { name: /Add Category Server/i }));
  return screen.findByRole("dialog", { name: "Add Category Server" });
}

/**
 * Add Category Server form (product_requirements.md §4.5, line 235) — a modal
 * now, opened from the list's "+ Add Category Server".
 *
 * The reference labels the main field "Category Type Name" — a leftover from
 * copy-pasting the Add Category Type form built immediately before it. The
 * corrected label is asserted here, and the old one asserted absent.
 *
 * The Name/Value option list is this tab's one new pattern: a field array,
 * same mechanism as the Category form's builder but with two plain text
 * fields per row.
 */
describe("AddCategoryServerDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens with a real subcopy, never lorem ipsum", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByRole("heading", { name: "Add Category Server" })).toBeInTheDocument();
    expect(within(dialog).queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("labels the main field 'Category Server Name', not the copy-pasted 'Category Type Name'", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByLabelText("Category Server Name")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Category Type Name")).not.toBeInTheDocument();
  });

  it("shows the empty-options message before any option is added", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    expect(within(dialog).getByText('No options yet. Click "Add Option" to add one.')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/^Name$/)).not.toBeInTheDocument();
  });

  it("'+ Add Option' appends a Name/Value row each time", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    const addOption = within(dialog).getByRole("button", { name: /Add Option/i });

    await user.click(addOption);
    expect(await within(dialog).findAllByLabelText(/^Name$/)).toHaveLength(1);
    expect(within(dialog).getAllByLabelText(/^Value$/)).toHaveLength(1);
    expect(within(dialog).queryByText('No options yet. Click "Add Option" to add one.')).not.toBeInTheDocument();

    await user.click(addOption);
    expect(await within(dialog).findAllByLabelText(/^Name$/)).toHaveLength(2);
  });

  it("each option row can be removed again", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    const addOption = within(dialog).getByRole("button", { name: /Add Option/i });
    await user.click(addOption);
    await user.click(addOption);
    expect(await within(dialog).findAllByLabelText(/^Name$/)).toHaveLength(2);

    await user.click(within(dialog).getByRole("button", { name: "Remove option 1" }));

    expect(await within(dialog).findAllByLabelText(/^Name$/)).toHaveLength(1);
  });

  it("blocks submit and never calls create when the name is empty", async () => {
    const createSpy = vi.spyOn(categoryServersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Category Server Name is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the category server with its options and closes the modal", async () => {
    const createSpy = vi.spyOn(categoryServersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    // A server belongs to a game; the API rejects a write without it.
    await user.click(within(dialog).getByLabelText("Category"));
    await user.click(await screen.findByRole("option", { name: "Mobile Legends" }));

    await user.type(within(dialog).getByLabelText("Category Server Name"), "Wuthering Waves");
    await user.click(within(dialog).getByRole("button", { name: /Add Option/i }));
    await user.type(within(dialog).getByLabelText(/^Name$/), "Asia");
    await user.type(within(dialog).getByLabelText(/^Value$/), "asia_01");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Wuthering Waves",
        options: [{ name: "Asia", value: "asia_01" }],
      }),
    );
    if (screen.queryByRole("dialog", { name: "Add Category Server" })) await waitForElementToBeRemoved(dialog);
    expect(await screen.findByText("Wuthering Waves")).toBeInTheDocument();
  });
});

/**
 * "+ Add Bulk" — a second button beside "+ Add Option" that reveals a Bulk
 * textarea for pasting many options at once. The reference's helper text
 * ("Bulk must be in the correct format.") never shows the format; confirmed
 * as one `Name=Value` pair per line, appending to whatever rows already exist.
 */
describe("AddCategoryServerDialog — bulk options", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows '+ Add Bulk' beside '+ Add Option', with the panel hidden until clicked", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    const addBulk = within(dialog).getByRole("button", { name: /Add Bulk/i });
    expect(within(dialog).getByRole("button", { name: /Add Option/i })).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Bulk")).not.toBeInTheDocument();

    await user.click(addBulk);

    expect(await within(dialog).findByLabelText("Bulk")).toBeInTheDocument();
    expect(within(dialog).getByText(/Bulk must be in the correct format/i)).toBeInTheDocument();
  });

  it("turns pasted lines into pre-filled Name/Value rows", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: /Add Bulk/i }));
    await user.type(await within(dialog).findByLabelText("Bulk"), "ASIA=asia{enter}EUROPE=europe");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    const names = await within(dialog).findAllByLabelText(/^Name$/);
    expect(names).toHaveLength(2);
    expect(names[0]).toHaveValue("ASIA");
    expect(names[1]).toHaveValue("EUROPE");
    expect(within(dialog).getAllByLabelText(/^Value$/)[1]).toHaveValue("europe");
  });

  it("appends to existing rows rather than replacing them", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: /Add Option/i }));
    await user.type(within(dialog).getByLabelText(/^Name$/), "Handmade");

    await user.click(within(dialog).getByRole("button", { name: /Add Bulk/i }));
    await user.type(await within(dialog).findByLabelText("Bulk"), "ASIA=asia{enter}EUROPE=europe");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    const names = await within(dialog).findAllByLabelText(/^Name$/);
    expect(names).toHaveLength(3);
    expect(names[0]).toHaveValue("Handmade");
    expect(names[2]).toHaveValue("EUROPE");
  });

  it("a malformed line appends nothing and keeps the pasted text for fixing", async () => {
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.click(within(dialog).getByRole("button", { name: /Add Bulk/i }));
    await user.type(await within(dialog).findByLabelText("Bulk"), "ASIA=asia{enter}EUROPE");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    expect(await within(dialog).findByText(/Line 2/)).toBeInTheDocument();
    // All-or-nothing: the valid first line must not land on its own.
    expect(within(dialog).queryByLabelText(/^Name$/)).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Bulk")).toHaveValue("ASIA=asia\nEUROPE");
  });

  it("Submit does not submit the outer form", async () => {
    const createSpy = vi.spyOn(categoryServersService, "create");
    const user = userEvent.setup();
    const dialog = await openAdd(user);

    await user.type(within(dialog).getByLabelText("Category Server Name"), "Wuthering Waves");
    await user.click(within(dialog).getByRole("button", { name: /Add Bulk/i }));
    await user.type(await within(dialog).findByLabelText("Bulk"), "ASIA=asia");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    expect(createSpy).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("heading", { name: "Add Category Server" })).toBeInTheDocument();
  });
});
