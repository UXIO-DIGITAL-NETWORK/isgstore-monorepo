import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { categoryServersService } from "../services/categoryServers.service";

const ADD_PATH = "/admin/categories-preview/category-server/add";

/**
 * Add Category Server form (product_requirements.md §4.5, line 235).
 *
 * The reference labels the main field "Category Type Name" — a leftover from
 * copy-pasting the Add Category Type form built immediately before it, not a
 * second reference to category types. The corrected label is asserted here,
 * and the old one asserted absent.
 *
 * The Name/Value option list is this tab's one new pattern: a field array,
 * same mechanism as the Category form's builder but with two plain text
 * fields per row.
 */
describe("AddCategoryServerPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the breadcrumb trail for the active tab", async () => {
    await renderRoute(ADD_PATH);

    const breadcrumb = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent(/Category.*Category Server.*Add Category Server/);
  });

  it("shows the header with a real subcopy, never lorem ipsum", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByRole("heading", { name: "Add Category Server" })).toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("labels the main field 'Category Server Name', not the copy-pasted 'Category Type Name'", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByLabelText("Category Server Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Category Type Name")).not.toBeInTheDocument();
  });

  it("shows the empty-options message before any option is added", async () => {
    await renderRoute(ADD_PATH);

    expect(await screen.findByText('No options yet. Click "Add Option" to add one.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Name$/)).not.toBeInTheDocument();
  });

  it("'+ Add Option' appends a Name/Value row each time", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    const addOption = await screen.findByRole("button", { name: /Add Option/i });

    await user.click(addOption);
    expect(await screen.findAllByLabelText(/^Name$/)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Value$/)).toHaveLength(1);
    expect(screen.queryByText('No options yet. Click "Add Option" to add one.')).not.toBeInTheDocument();

    await user.click(addOption);
    expect(await screen.findAllByLabelText(/^Name$/)).toHaveLength(2);
  });

  it("each option row can be removed again", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    const addOption = await screen.findByRole("button", { name: /Add Option/i });
    await user.click(addOption);
    await user.click(addOption);
    expect(await screen.findAllByLabelText(/^Name$/)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Remove option 1" }));

    expect(await screen.findAllByLabelText(/^Name$/)).toHaveLength(1);
  });

  it("blocks submit and never calls create when the name is empty", async () => {
    const createSpy = vi.spyOn(categoryServersService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Category Server Name is required")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("creates the category server with its options and returns to the list", async () => {
    const createSpy = vi.spyOn(categoryServersService, "create");
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.type(await screen.findByLabelText("Category Server Name"), "Wuthering Waves");
    await user.click(screen.getByRole("button", { name: /Add Option/i }));
    await user.type(screen.getByLabelText(/^Name$/), "Asia");
    await user.type(screen.getByLabelText(/^Value$/), "asia_01");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Wuthering Waves",
        options: [{ name: "Asia", value: "asia_01" }],
      }),
    );
    expect(await screen.findByRole("heading", { name: "Category Server" })).toBeInTheDocument();
    expect(await screen.findByText("Wuthering Waves")).toBeInTheDocument();
  });
});
