import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { membershipService } from "../services/membership.service";
import type { MembershipTier } from "../types/membership.type";

const tier = (overrides: Partial<MembershipTier> = {}): MembershipTier => ({
  id: "1",
  name: "Gold",
  min_spend: 1000000,
  discount_percent: 5,
  is_active: true,
  created_at: "2026-07-01",
  updated_at: "2026-07-01",
  ...overrides,
});

const paginated = (rows: MembershipTier[]) => ({
  data: rows,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: "", per_page: 10, to: rows.length, total: rows.length },
});

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("MembershipListPage", () => {
  it("lists tiers with their spend threshold and discount", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([tier()]));

    await renderRoute("/admin/memberships");

    expect(await screen.findByRole("heading", { name: "Membership" })).toBeInTheDocument();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  it("deletes a tier only after confirmation", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([tier()]));
    const removeSpy = vi.spyOn(membershipService, "remove").mockResolvedValue();
    const user = userEvent.setup();
    await renderRoute("/admin/memberships");

    await user.click(await screen.findByRole("button", { name: "Actions for Gold" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(removeSpy).toHaveBeenCalledWith("1");
  });
});
