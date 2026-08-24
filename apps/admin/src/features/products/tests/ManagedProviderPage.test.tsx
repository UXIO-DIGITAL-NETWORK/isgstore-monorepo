import { describe, it, expect, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Managed Product Provider tab, served by fakeApi's `supplier-products` seed:
 * one System row (Membership VIP — protected) and one Uxiotopup row
 * (MOBILELEGEND - 19 Diamond).
 */
describe("ManagedProviderPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null, permissions: [] });
  });

  it("renders the managed provider rows", async () => {
    await renderRoute("/admin/products/provider");

    expect(await screen.findByRole("heading", { name: "Product Provider" })).toBeInTheDocument();
    expect(await screen.findByText("Membership VIP")).toBeInTheDocument();
    expect(screen.getByText("MOBILELEGEND - 19 Diamond")).toBeInTheDocument();
  });

  it("protects the System row: a lock instead of a checkbox, and no delete", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider");

    const systemRow = (await screen.findByText("Membership VIP")).closest("tr") as HTMLElement;
    // No selection checkbox — a lock glyph takes its slot.
    expect(within(systemRow).queryByLabelText("Select row")).not.toBeInTheDocument();
    expect(within(systemRow).getByLabelText("Locked row")).toBeInTheDocument();

    await user.click(within(systemRow).getByRole("button", { name: /Actions for Membership VIP/ }));
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Set Profit Margin" })).toBeInTheDocument();
  });

  it("lets a non-System row be selected and deleted", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider");

    const row = (await screen.findByText("MOBILELEGEND - 19 Diamond")).closest("tr") as HTMLElement;
    expect(within(row).getByLabelText("Select row")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: /Actions for MOBILELEGEND/ }));
    expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("confirms before locking a price", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider");

    const row = (await screen.findByText("MOBILELEGEND - 19 Diamond")).closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: /Actions for MOBILELEGEND/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Lock Price" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Lock this price?")).toBeInTheDocument();
  });

  it("reveals the bulk actions chip once a row is selected", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/products/provider");

    const row = (await screen.findByText("MOBILELEGEND - 19 Diamond")).closest("tr") as HTMLElement;
    expect(screen.queryByRole("button", { name: /items selected/ })).not.toBeInTheDocument();

    await user.click(within(row).getByLabelText("Select row"));

    await user.click(await screen.findByRole("button", { name: /1 items selected/ }));
    expect(await screen.findByRole("menuitem", { name: "Lock Price" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Edit Profit Margin" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });
});
