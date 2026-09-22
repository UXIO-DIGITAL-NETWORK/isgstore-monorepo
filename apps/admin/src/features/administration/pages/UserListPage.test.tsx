import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

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
  it("requests only the admin and member accounts", async () => {
    const listSpy = vi.spyOn(usersService, "list").mockResolvedValue(paginated([adminUser()]));

    await renderRoute("/admin/users");
    await screen.findByText("Super Admin");

    // Staff/internal roles also live in `users`; only the client's own people
    // belong in this list.
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, roles: ["admin", "member"] }),
    );
    expect(listSpy).not.toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
  });

  it("lists members beside admins and links each name to its detail page", async () => {
    vi.spyOn(usersService, "list").mockResolvedValue(
      paginated([
        adminUser(),
        adminUser({ id: "9", role: "member", name: "Randy Galang", email: "randy@example.test" }),
      ]),
    );

    await renderRoute("/admin/users");

    expect(await screen.findByText("Super Admin")).toBeInTheDocument();
    // The row is the way into the detail page; the actions menu stays on the list.
    const member = await screen.findByRole("link", { name: "Randy Galang" });
    expect(member).toHaveAttribute("href", "/admin/users/9");
  });

  it("offers a Detail action in each row's menu", async () => {
    vi.spyOn(usersService, "list").mockResolvedValue(paginated([adminUser()]));

    await renderRoute("/admin/users");
    await screen.findByText("Super Admin");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions for Super Admin" }));

    const detail = await screen.findByRole("menuitem", { name: "Detail" });
    expect(detail).toHaveAttribute("href", "/admin/users/3");
  });
});
