import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usersService } from "../services/administration.service";
import type { AdminUser } from "../types/administration.type";

const adminUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: "3",
  role_id: "1",
  role: "admin",
  name: "Super Admin",
  email: "admin@isgstore.id",
  phone: "6281200000001",
  balance: 0,
  point: 0,
  locale: "id",
  status: "active",
  email_verified_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01",
  ...overrides,
});

const paginated = (rows: AdminUser[]) => ({
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

describe("UserListPage", () => {
  it("requests only admin-role users", async () => {
    const listSpy = vi.spyOn(usersService, "list").mockResolvedValue(paginated([adminUser()]));

    await renderRoute("/admin/users");
    await screen.findByText("Super Admin");

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
  });

  it("does not list merchant, hub-system or internal accounts", async () => {
    vi.spyOn(usersService, "list").mockResolvedValue(paginated([adminUser()]));

    await renderRoute("/admin/users");
    await screen.findByText("Super Admin");

    expect(screen.queryByText("Client Merchant")).not.toBeInTheDocument();
    expect(screen.queryByText("Uxio Hub (sistem)")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal Finance")).not.toBeInTheDocument();
  });
});
