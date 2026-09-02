import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { providerPoolService } from "../services/providerPool.service";

const POOL_PATH = "/admin/products/provider";
/** The fixture row that is pooled and already priced — promotable. */
const READY_ROW = "Valorant 420 Points";

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

  it("Add Product Provider leads to its own page, not a second table on this one", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("link", { name: /Add Product Provider/ }));

    expect(await screen.findByRole("heading", { name: "Add Product Provider" })).toBeInTheDocument();
    // The pool page is gone — one screen, one table.
    expect(screen.queryByRole("heading", { name: "Product Provider" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search provider product")).not.toBeInTheDocument();
  });

  it("opens showing the whole mapped catalogue, not just what is new", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("link", { name: /Add Product Provider/ }));

    // The checker backdates every SKU on its first run so the "New" badge means
    // something — which leaves nothing "new" on an established install. Defaulting
    // this filter to "New only" therefore opened the page onto an empty table.
    expect(await screen.findByLabelText("Filter by pool state")).toHaveTextContent("All");
    expect(await screen.findByText("Valorant 120 Points")).toBeInTheDocument();
    // Already-pooled SKUs are visible too, so the catalogue reads as covered
    // rather than missing — they just cannot be selected again.
    expect(screen.getByText("Mobile Legends 86 Diamond")).toBeInTheDocument();
  });

  it("offers only SKUs whose game is mapped under Category Provider", async () => {
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("link", { name: /Add Product Provider/ }));

    // "Valorant" is a configured Category Provider; "Pulsa" is not, so its SKUs
    // are never offered however many the provider publishes.
    expect(await screen.findByText("Valorant 120 Points")).toBeInTheDocument();
    expect(screen.queryByText("Telkomsel Pulsa 5.000")).not.toBeInTheDocument();
  });

  it("adds the selected SKUs to the pool", async () => {
    const poolSpy = vi.spyOn(providerPoolService, "pool").mockResolvedValue({ pooled: 1, skipped: [] });
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("link", { name: /Add Product Provider/ }));

    const row = (await screen.findByText("Valorant 120 Points")).closest("tr") as HTMLElement;
    await user.click(within(row).getByLabelText("Select row"));
    // Selection is reported upward by an effect, so wait for the count to land.
    await user.click(await screen.findByRole("button", { name: "Add 1 to pool" }));

    expect(poolSpy).toHaveBeenCalledWith(["VAL120"]);

    // Adding ends the flow: back to the pool, where the new rows now live.
    expect(await screen.findByRole("heading", { name: "Product Provider" })).toBeInTheDocument();
  });

  /**
   * The pool is the waiting room, not the catalogue. A SKU that has been
   * promoted lives on the Main Products list — leaving it visible in both is
   * what made "where does this product live?" unanswerable, and stranded a
   * Publish action on a row the admin had already moved past.
   */
  it("lists only SKUs that are still in the pool", async () => {
    await renderRoute(POOL_PATH);
    const table = await screen.findByRole("table");

    expect(await within(table).findAllByText(/Needs margin|Ready/)).not.toHaveLength(0);
    expect(within(table).queryByText("Published")).not.toBeInTheDocument();
    expect(within(table).queryByText("Draft")).not.toBeInTheDocument();
  });

  it("promotes and publishes in one step from the row menu", async () => {
    const spy = vi
      .spyOn(providerPoolService, "bulkPromoteAndPublish")
      .mockResolvedValue({ promoted: 1, published: 1, skipped: [] });
    const user = userEvent.setup();
    await renderRoute(POOL_PATH);

    await user.click(await screen.findByRole("button", { name: `Actions for ${READY_ROW}` }));
    await user.click(await screen.findByRole("menuitem", { name: /Promote & Publish/ }));

    expect(spy).toHaveBeenCalledTimes(1);
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
    expect(await screen.findByLabelText("Basic margin (%) · default tier")).toBeInTheDocument();
    expect(screen.getByLabelText("Lower Price Limit (Min)")).toBeInTheDocument();
    expect(screen.getByLabelText("Upper Price Limit (Max)")).toBeInTheDocument();
  });
});
