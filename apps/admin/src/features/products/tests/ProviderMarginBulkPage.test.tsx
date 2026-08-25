import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Set Profit Margin (Bulk) page — the selection rides in `?ids=`, and the left
 * column shows each selected provider product's price breakdown.
 */
describe("ProviderMarginBulkPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null, permissions: [] });
  });

  it("renders the margin form and the selected items", async () => {
    await renderRoute("/admin/products/provider/set-profit-margin?ids=2");

    expect(await screen.findByRole("heading", { name: "Set Profit Margin" })).toBeInTheDocument();
    expect(await screen.findByText("MOBILELEGEND - 19 Diamond")).toBeInTheDocument();
    expect(screen.getByLabelText("Public margin (%)")).toBeInTheDocument();
    expect(screen.getByLabelText("Agent margin (%)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("shows loading skeletons while the selected products load", async () => {
    const { container } = await renderRoute("/admin/products/provider/set-profit-margin?ids=2");

    // While the fetch is in flight, the left column shows skeleton cards instead
    // of the empty-state copy, so the admin knows products are still loading.
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("No selected products to show.")).not.toBeInTheDocument();

    // ...and the skeletons give way to the real product once it resolves.
    expect(await screen.findByText("MOBILELEGEND - 19 Diamond")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
  });

  it("has nothing to save with an empty selection", async () => {
    await renderRoute("/admin/products/provider/set-profit-margin");

    expect(await screen.findByRole("heading", { name: "Set Profit Margin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
