import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { makeUser, renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { pricingService } from "../services/pricing.service";
import type { PricingRule } from "../types/pricingRule.type";

const rule = (overrides: Partial<PricingRule> = {}): PricingRule => ({
  id: "1",
  category_id: null,
  category_name: null,
  role: "member",
  markup_percent: 20,
  markup_flat: 0,
  ...overrides,
});

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("PricingRulesPage", () => {
  it("lists rules with their role, scope and markup", async () => {
    vi.spyOn(pricingService, "list").mockResolvedValue([rule()]);
    vi.spyOn(pricingService, "categoryOptions").mockResolvedValue([]);

    await renderRoute("/admin/pricing");

    expect(await screen.findByRole("heading", { name: "Pricing Rules" })).toBeInTheDocument();
    expect(await screen.findByText("All categories (global)")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("creates a rule through the Add modal", async () => {
    vi.spyOn(pricingService, "list").mockResolvedValue([]);
    vi.spyOn(pricingService, "categoryOptions").mockResolvedValue([]);
    const createSpy = vi.spyOn(pricingService, "create").mockResolvedValue(rule());
    const user = userEvent.setup();
    await renderRoute("/admin/pricing");

    await user.click(await screen.findByRole("button", { name: /Add Rule/ }));
    const dialog = await screen.findByRole("dialog", { name: "Add Pricing Rule" });
    await user.clear(within(dialog).getByLabelText("Markup %"));
    await user.type(within(dialog).getByLabelText("Markup %"), "25");
    await user.click(within(dialog).getByRole("button", { name: "Add Rule" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "member", category_id: null, markup_percent: 25 }),
    );
  });
});
