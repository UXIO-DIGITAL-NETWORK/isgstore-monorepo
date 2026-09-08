import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { renderRoute, screen, makeUser } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The navbar user menu must render the real authenticated user from
 * useAuthStore — not the retired "Randy Galang" operator fixture. Queries are
 * exact strings on purpose: the activity feed fixture still contains
 * "Randy Galang" inside longer strings ("By Randy Galang as Admin"), which an
 * exact match will not (and must not) hit.
 */
const mockUser = makeUser();

describe("DashboardNavbar user menu", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", user: mockUser, permissions: ["*"] });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null, user: null, permissions: [] });
  });

  it("renders the authenticated user's name and email from the auth store", async () => {
    await renderRoute("/admin/dashboard");

    expect(screen.getByText("Dimas Sufyan")).toBeInTheDocument();
    expect(screen.getByText("dimas@isgstore.id")).toBeInTheDocument();
  });

  it("no longer renders the mock operator fixture identity", async () => {
    await renderRoute("/admin/dashboard");

    expect(screen.queryByText("Randy Galang")).not.toBeInTheDocument();
    expect(screen.queryByText("randy@uxio.com")).not.toBeInTheDocument();
  });
});
