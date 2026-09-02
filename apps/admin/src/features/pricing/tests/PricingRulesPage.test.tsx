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
  membership_plan_id: 1,
  plan_name: "Basic",
  markup_percent: 20,
  markup_flat: 0,
  ...overrides,
});

const planOptions = [
  { value: "1", label: "Basic", is_default: true },
  { value: "2", label: "Gold", is_default: false },
];

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("PricingRulesPage", () => {
  it("lists rules with their plan, scope and markup", async () => {
    vi.spyOn(pricingService, "list").mockResolvedValue([rule()]);
    vi.spyOn(pricingService, "categoryOptions").mockResolvedValue([]);
    vi.spyOn(pricingService, "planOptions").mockResolvedValue(planOptions);

    await renderRoute("/admin/pricing");

    expect(await screen.findByRole("heading", { name: "Pricing Rules" })).toBeInTheDocument();
    expect(await screen.findByText("All categories (global)")).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("names the fallback rule rather than showing an empty plan cell", async () => {
    // A rule with no plan is the fallback every unpriced tier uses — the row
    // that keeps an admin-invented plan priced.
    vi.spyOn(pricingService, "list").mockResolvedValue([rule({ membership_plan_id: null, plan_name: null })]);
    vi.spyOn(pricingService, "categoryOptions").mockResolvedValue([]);
    vi.spyOn(pricingService, "planOptions").mockResolvedValue(planOptions);

    await renderRoute("/admin/pricing");

    expect(await screen.findByText("All plans")).toBeInTheDocument();
  });

  it("creates a rule through the Add modal", async () => {
    vi.spyOn(pricingService, "list").mockResolvedValue([]);
    vi.spyOn(pricingService, "categoryOptions").mockResolvedValue([]);
    vi.spyOn(pricingService, "planOptions").mockResolvedValue(planOptions);
    const createSpy = vi.spyOn(pricingService, "create").mockResolvedValue(rule());
    const user = userEvent.setup();
    await renderRoute("/admin/pricing");

    await user.click(await screen.findByRole("button", { name: /Add Rule/ }));
    const dialog = await screen.findByRole("dialog", { name: "Add Pricing Rule" });
    await user.clear(within(dialog).getByLabelText("Markup %"));
    await user.type(within(dialog).getByLabelText("Markup %"), "25");
    await user.click(within(dialog).getByRole("button", { name: "Add Rule" }));

    // Defaults to the fallback: no plan, no category.
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ membership_plan_id: null, category_id: null, markup_percent: 25 }),
    );
  });
});
