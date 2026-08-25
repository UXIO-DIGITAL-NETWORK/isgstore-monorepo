import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { makeUser, renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { membershipService } from "../services/membership.service";
import type { MembershipPlan } from "../types/membership.type";

const plan = (overrides: Partial<MembershipPlan> = {}): MembershipPlan => ({
  id: "1",
  code: "gold",
  name: "Gold",
  benefits: [],
  price: 50000,
  duration_days: 30,
  role_id: null,
  is_popular: false,
  is_active: true,
  sort_order: 0,
  ...overrides,
});

const paginated = (rows: MembershipPlan[]) => ({
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
  it("lists plans with their price and duration", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([plan()]));

    await renderRoute("/admin/memberships");

    expect(await screen.findByRole("heading", { name: "Membership" })).toBeInTheDocument();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });

  // A null duration is the API's "never expires". Printing it raw would read as
  // a broken row, and the 0 the API used to coerce it to read as broken too.
  it("shows a plan with no duration as Lifetime", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([plan({ duration_days: null })]));

    await renderRoute("/admin/memberships");

    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Lifetime")).toBeInTheDocument();
    expect(screen.queryByText(/days/)).not.toBeInTheDocument();
  });

  it("creates a lifetime plan by default", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([]));
    const createSpy = vi.spyOn(membershipService, "create").mockResolvedValue(plan());
    const user = userEvent.setup();
    await renderRoute("/admin/memberships");

    await user.click(await screen.findByRole("button", { name: /Add Plan/ }));
    const dialog = await screen.findByRole("dialog", { name: "Add Plan" });
    await user.type(within(dialog).getByLabelText("Code"), "gold");
    await user.type(within(dialog).getByLabelText("Name"), "Gold");
    await user.clear(within(dialog).getByLabelText("Price"));
    await user.type(within(dialog).getByLabelText("Price"), "50000");
    // Lifetime is on out of the box, so the duration input is not reachable.
    expect(within(dialog).getByLabelText("Duration (days)")).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Add Plan" }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ code: "gold", name: "Gold", price: 50000, duration_days: null }),
    );
    // Form-only state must not reach the API.
    expect(createSpy.mock.calls[0][0]).not.toHaveProperty("is_lifetime");
  });

  it("sends a real duration once Lifetime is switched off", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([]));
    const createSpy = vi.spyOn(membershipService, "create").mockResolvedValue(plan());
    const user = userEvent.setup();
    await renderRoute("/admin/memberships");

    await user.click(await screen.findByRole("button", { name: /Add Plan/ }));
    const dialog = await screen.findByRole("dialog", { name: "Add Plan" });
    await user.type(within(dialog).getByLabelText("Code"), "gold");
    await user.type(within(dialog).getByLabelText("Name"), "Gold");
    await user.clear(within(dialog).getByLabelText("Price"));
    await user.type(within(dialog).getByLabelText("Price"), "50000");
    await user.click(within(dialog).getByLabelText("Lifetime"));
    await user.type(within(dialog).getByLabelText("Duration (days)"), "30");
    await user.click(within(dialog).getByRole("button", { name: "Add Plan" }));

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ duration_days: 30 }));
  });

  it("deletes a plan only after confirmation", async () => {
    vi.spyOn(membershipService, "list").mockResolvedValue(paginated([plan()]));
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
