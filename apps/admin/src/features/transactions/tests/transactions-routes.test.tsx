import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Part 4 — test cases (see system_architecture.md §4.2/§5):
 *
 * - /admin/transactions redirects to /admin/transactions/automatic for an authenticated
 *   admin, resolving the Automatic table content.
 * - /admin/transactions/automatic redirects to /login when unauthenticated (auth
 *   still enforced on top of the feature's own permission gate).
 * - Both "Automatic"/"Manual" tab links are present on the automatic view.
 */
describe("transactions routes", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token" });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null });
  });

  it("redirects /admin/transactions to the Automatic tab for an authenticated admin", async () => {
    await renderRoute("/admin/transactions");

    expect(await screen.findByRole("heading", { name: "Automatic Transaction History" })).toBeInTheDocument();
  });

  it("redirects /admin/transactions/automatic to /login when unauthenticated", async () => {
    useAuthStore.setState({ token: null });

    await renderRoute("/admin/transactions/automatic");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows both Automatic and Manual tab links", async () => {
    await renderRoute("/admin/transactions");

    expect(await screen.findByRole("tab", { name: "Automatic" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Manual" })).toBeInTheDocument();
  });
});
