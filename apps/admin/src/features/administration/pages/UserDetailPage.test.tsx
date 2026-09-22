import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usersService } from "../services/administration.service";
import type { AdminUser, BalanceMutationRow, UserOverview } from "../types/administration.type";

const member: AdminUser = {
  id: "9",
  role_id: "2",
  role: "member",
  name: "Randy Galang",
  email: "randy@example.test",
  phone: "6281234567890",
  balance: 250000,
  point: 42,
  locale: "id",
  status: "active",
  email_verified_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

const overview: UserOverview = {
  user: member,
  stats: { transactions_count: 3, total_spent: 300000, refunds_count: 1, topups_count: 0 },
  membership: {
    plan: "VIP",
    status: "active",
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: "2026-02-01T00:00:00Z",
    lifetime: false,
  },
};

const movement: BalanceMutationRow = {
  id: "1",
  type: "topup",
  amount: 100000,
  balance_before: 0,
  balance_after: 100000,
  reference: "TOP-1",
  description: "Top up saldo",
  created_at: "2026-01-02T00:00:00Z",
};

function paginated<T>(rows: T[]) {
  return {
    data: rows,
    links: { first: null, last: null, prev: null, next: null },
    meta: { current_page: 1, from: 1, last_page: 1, path: "", per_page: 10, to: rows.length, total: rows.length },
  };
}

/** The empty reads every tab makes; a test overrides only what it asserts on. */
function stubReads(mutations: BalanceMutationRow[] = []) {
  vi.spyOn(usersService, "balanceMutations").mockResolvedValue(paginated(mutations));
  vi.spyOn(usersService, "pointHistory").mockResolvedValue(paginated([]));
  vi.spyOn(usersService, "refunds").mockResolvedValue(paginated([]));
}

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("UserDetailPage", () => {
  it("shows the account, its aggregates and its wallet movements", async () => {
    vi.spyOn(usersService, "overview").mockResolvedValue(overview);
    stubReads([movement]);

    await renderRoute("/admin/users/9");

    expect(await screen.findByRole("heading", { name: "Randy Galang" })).toBeInTheDocument();
    // Settled spend, from the aggregate — not the raw orders.
    expect(screen.getByText("Total Spend")).toBeInTheDocument();
    // The membership line carries its end date in the same node.
    expect(screen.getByText(/Membership: VIP/)).toBeInTheDocument();
    // The wallet tab is scoped to this account and rendered from its own read.
    expect(await screen.findByText("Top up saldo")).toBeInTheDocument();
  });

  it("says so rather than rendering a blank page when the account is gone", async () => {
    vi.spyOn(usersService, "overview").mockRejectedValue(new Error("404"));
    stubReads();

    await renderRoute("/admin/users/999");

    expect(await screen.findByText("User not found.")).toBeInTheDocument();
  });
});
