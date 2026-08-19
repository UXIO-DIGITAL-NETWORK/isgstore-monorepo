import { describe, it, expect, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Product Provider tab — the Digiflazz price list served by fakeApi. `X100` is
 * seeded as already-mapped, `S5` as unmapped, so the mapped badge and the
 * disabled-Add behaviour both have something concrete to assert.
 */
describe("ProductProviderPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null, permissions: [] });
  });

  it("renders the header and the toolbar", async () => {
    await renderRoute("/admin/products/provider/add");

    expect(await screen.findByRole("heading", { name: "Product Provider" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search product, SKU or brand")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByLabelText("Only unmapped")).toBeInTheDocument();
  });

  it("lists the price-list rows from the Digiflazz endpoint", async () => {
    await renderRoute("/admin/products/provider/add");

    expect(await screen.findByText("Xl 100.000")).toBeInTheDocument();
    expect(screen.getByText("Telkomsel Pulsa 5.000")).toBeInTheDocument();
  });

  it("marks an already-mapped SKU and disables its Add button", async () => {
    await renderRoute("/admin/products/provider/add");

    const mappedRow = (await screen.findByText("Xl 100.000")).closest("tr") as HTMLElement;
    expect(within(mappedRow).getByText("Mapped")).toBeInTheDocument();
    expect(within(mappedRow).getByRole("button", { name: "Added" })).toBeDisabled();
  });

  it("offers an enabled Add button for an unmapped SKU", async () => {
    await renderRoute("/admin/products/provider/add");

    const freshRow = (await screen.findByText("Telkomsel Pulsa 5.000")).closest("tr") as HTMLElement;
    expect(within(freshRow).getByText("Not mapped")).toBeInTheDocument();
    expect(within(freshRow).getByRole("button", { name: "Add to products" })).toBeEnabled();
  });

  it("filters the list by search", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider/add");

    await screen.findByText("Xl 100.000");
    await user.type(screen.getByPlaceholderText("Search product, SKU or brand"), "telkomsel");

    await waitForRemoved("Xl 100.000");
    expect(screen.getByText("Telkomsel Pulsa 5.000")).toBeInTheDocument();
  });

  it("reveals the bulk add button once a row is selected", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider/add");

    await screen.findByText("Telkomsel Pulsa 5.000");
    expect(screen.queryByRole("button", { name: /Add selected/ })).not.toBeInTheDocument();

    await user.click(screen.getAllByLabelText("Select row")[0]);
    expect(await screen.findByRole("button", { name: /Add selected \(1\)/ })).toBeInTheDocument();
  });

  it("opens the add dialog with prices pre-filled from the SKU's suggestions", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider/add");

    const freshRow = (await screen.findByText("Telkomsel Pulsa 5.000")).closest("tr") as HTMLElement;
    await user.click(within(freshRow).getByRole("button", { name: "Add to products" }));

    // Dialog opens; the member-price input carries the suggested value
    // (cost 5100 × 1.2 = 6120) once the SKU preview resolves.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const memberInput = await screen.findByLabelText("Member price");
    await expectValue(memberInput, "6120");
  });

  it("hides the Add action without the products.create permission", async () => {
    // products.view lets the route render; products.create is what gates Add.
    useAuthStore.setState({ token: "test-token", permissions: ["products.view"] });
    await renderRoute("/admin/products/provider/add");

    await screen.findByText("Telkomsel Pulsa 5.000");
    expect(screen.queryByRole("button", { name: "Add to products" })).not.toBeInTheDocument();
  });
});

/** Poll until a piece of text leaves the DOM (search refetch has no spinner). */
async function waitForRemoved(text: string) {
  const { waitFor } = await import("@testing-library/react");
  await waitFor(() => expect(screen.queryByText(text)).not.toBeInTheDocument());
}

async function expectValue(element: HTMLElement, value: string) {
  const { waitFor } = await import("@testing-library/react");
  await waitFor(() => expect(element).toHaveValue(value));
}
