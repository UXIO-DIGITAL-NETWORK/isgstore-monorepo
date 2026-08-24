import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { providerPoolService } from "../services/providerPool.service";

const POOL_PATH = "/admin/products/provider";

/**
 * The provider pool: SKUs are pulled in, priced, promoted to a draft product and
 * only then published. The gates are what this file pins — an unpriced SKU must
 * not be promotable, and a pooled row must never read as something that sells.
 */
describe("Provider pool", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ token: null, permissions: [] });
  });

  it("opens Add Product Provider in place, without leaving the pool", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Product Provider/ }));

    // The panel is part of the page — the pool table is still on screen.
    expect(await screen.findByRole("heading", { name: "Add Product Provider" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product Provider" })).toBeInTheDocument();
    // Still the pool page's own toolbar, not a route the panel navigated to.
    expect(screen.getByPlaceholderText("Search provider product")).toBeInTheDocument();
  });

  it("offers only SKUs whose game is mapped under Category Provider", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Product Provider/ }));

    // Scoped to the panel: the pool table behind it lists some of the same names.
    const panel = within(await screen.findByRole("region", { name: "Add Product Provider" }));
    // "Valorant" is a configured Category Provider; "Pulsa" is not, so its SKUs
    // are never offered however many the provider publishes.
    expect(await panel.findByText("Valorant 120 Points")).toBeInTheDocument();
    expect(panel.queryByText("Telkomsel Pulsa 5.000")).not.toBeInTheDocument();
  });

  it("adds the selected SKUs to the pool", async () => {
    const poolSpy = vi.spyOn(providerPoolService, "pool").mockResolvedValue({ pooled: 1, skipped: [] });
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("button", { name: /Add Product Provider/ }));

    const panelEl = await screen.findByRole("region", { name: "Add Product Provider" });
    const panel = within(panelEl);
    const row = (await panel.findByText("Valorant 120 Points")).closest("tr") as HTMLElement;
    await user.click(within(row).getByLabelText("Select row"));
    // Selection is reported upward by an effect, so wait for the count to land.
    await user.click(await panel.findByRole("button", { name: "Add 1 to pool" }));

    expect(poolSpy).toHaveBeenCalledWith(["VAL120"]);
  });

  it("will not promote a pooled SKU whose margin has not been set, and says why", async () => {
    const promoteSpy = vi.spyOn(providerPoolService, "bulkPromote");
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    const row = (await screen.findByText("Valorant 120 Points")).closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: /Actions for Valorant 120 Points/ }));

    const promote = await screen.findByRole("menuitem", { name: /Promote to Main Product/ });
    expect(promote).toHaveAttribute("aria-disabled", "true");
    // The reason is the server's, so the menu and the API's 422 cannot disagree.
    expect(promote).toHaveTextContent("Set profit margin terlebih dahulu sebelum promote.");

    await user.click(promote);
    expect(promoteSpy).not.toHaveBeenCalled();
  });

  it("promotes a priced pooled SKU", async () => {
    const promoteSpy = vi
      .spyOn(providerPoolService, "bulkPromote")
      .mockResolvedValue({ promoted: 1, skipped: [] });
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    const row = (await screen.findByText("Valorant 420 Points")).closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: /Actions for Valorant 420 Points/ }));
    await user.click(await screen.findByRole("menuitem", { name: /Promote to Main Product/ }));

    expect(promoteSpy).toHaveBeenCalledWith(["4"]);
  });

  it("shows a pooled row's prices as a projection, not as zeroes", async () => {
    await renderRoute(POOL_PATH);

    const row = (await screen.findByText("Valorant 120 Points")).closest("tr") as HTMLElement;

    // 15.000 cost at the default 20% member markup.
    expect(within(row).getByText("Rp 18.000")).toBeInTheDocument();
    expect(within(row).getByText(/Projected from the margin/)).toBeInTheDocument();
    expect(within(row).getByText("Needs margin")).toBeInTheDocument();
  });

  it("carries a single row into the margin page, which also takes the price window", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    const row = (await screen.findByText("Valorant 120 Points")).closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: /Actions for Valorant 120 Points/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Set Profit Margin" }));

    expect(await screen.findByRole("heading", { name: "Set Profit Margin" })).toBeInTheDocument();
    expect(screen.getByLabelText("Public margin (%)")).toBeInTheDocument();
    expect(screen.getByLabelText("Lower Price Limit (Min)")).toBeInTheDocument();
    expect(screen.getByLabelText("Upper Price Limit (Max)")).toBeInTheDocument();
  });
});
