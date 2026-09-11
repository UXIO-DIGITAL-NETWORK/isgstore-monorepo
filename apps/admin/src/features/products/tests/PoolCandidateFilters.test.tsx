import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, waitFor } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { providerPoolService } from "../services/providerPool.service";
import { countActiveFilters, EMPTY_POOL_FILTERS, type PoolFilterState } from "../lib/poolFilters";

/**
 * Narrowing the Add Product Provider list.
 *
 * The page shows a provider's whole catalogue for every configured game, so the
 * filters are what make it usable. What is worth pinning is that each control
 * reaches the API as its own parameter and that they combine — a filter that
 * silently does nothing still looks right on screen.
 */
const ADD_PATH = "/admin/products/provider/add";

/** The params of the most recent candidates request. */
const lastParams = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.at(-1)?.[0] as Record<string, unknown> | undefined;

const spyOnCandidates = () => vi.spyOn(providerPoolService, "candidates");

describe("pool candidate filters", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ token: null, permissions: [] });
  });

  it("sends the provider category as its own parameter", async () => {
    const candidates = spyOnCandidates();
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByLabelText("Filter by provider category"));
    await user.click(await screen.findByRole("option", { name: /Mobile Legends/i }));

    await waitFor(() => expect(lastParams(candidates)?.provider_category).toBe("Mobile Legends"));
  });

  it("sends a cost range, and only once typing has settled", async () => {
    const candidates = spyOnCandidates();
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.type(await screen.findByLabelText("Minimum cost"), "10000");
    await user.type(screen.getByLabelText("Maximum cost"), "50000");

    await waitFor(() => {
      expect(lastParams(candidates)?.cost_min).toBe(10000);
      expect(lastParams(candidates)?.cost_max).toBe(50000);
    });

    // Debounced: five keystrokes per field must not be ten requests.
    expect(candidates.mock.calls.length).toBeLessThan(6);
  });

  it("refuses to send a range that cannot match", async () => {
    // Mid-edit a ceiling is briefly below the floor. The API 422s on that, so
    // the page drops the ceiling rather than turning a keystroke into an error.
    const candidates = spyOnCandidates();
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.type(await screen.findByLabelText("Minimum cost"), "50000");
    await user.type(screen.getByLabelText("Maximum cost"), "100");

    await waitFor(() => expect(lastParams(candidates)?.cost_min).toBe(50000));
    expect(lastParams(candidates)?.cost_max).toBeUndefined();
  });

  it("sends a sort, and leaves the provider order alone by default", async () => {
    const candidates = spyOnCandidates();
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await waitFor(() => expect(candidates).toHaveBeenCalled());
    expect(lastParams(candidates)?.sort).toBeUndefined();

    await user.click(screen.getByLabelText("Sort services"));
    await user.click(await screen.findByRole("option", { name: /Cost, low to high/i }));

    await waitFor(() => expect(lastParams(candidates)?.sort).toBe("cost_asc"));
  });

  it("returns to the first page whenever the list is narrowed", async () => {
    // Page 4 of a filtered set is usually past the end, which reads as "no
    // results" for a filter that in fact matched plenty.
    const candidates = spyOnCandidates();
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await user.click(await screen.findByLabelText("Filter by availability"));
    await user.click(await screen.findByRole("option", { name: /^All$/i }));

    await waitFor(() => expect(lastParams(candidates)?.availability).toBe("all"));
    expect(lastParams(candidates)?.page).toBe(1);
  });

  it("offers a reset once anything is narrowed, and not before", async () => {
    const user = userEvent.setup();
    await renderRoute(ADD_PATH);

    await screen.findByLabelText("Sort services");
    expect(screen.queryByRole("button", { name: /reset filters/i })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Sort services"));
    await user.click(await screen.findByRole("option", { name: /Cost, low to high/i }));

    const reset = await screen.findByRole("button", { name: /reset filters/i });
    await user.click(reset);

    await waitFor(() => expect(screen.queryByRole("button", { name: /reset filters/i })).not.toBeInTheDocument());
  });
});

describe("countActiveFilters", () => {
  it("counts only what differs from the defaults", () => {
    // "Available only" is the default, so it is not a filter the admin applied
    // — counting it would show "1 filter active" on an untouched page.
    expect(countActiveFilters(EMPTY_POOL_FILTERS)).toBe(0);

    const narrowed: PoolFilterState = { ...EMPTY_POOL_FILTERS, costMin: "1000", providerCategory: "Valorant" };
    expect(countActiveFilters(narrowed)).toBe(2);
  });
});
