import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Real nested routes for the five Category tabs (product_requirements.md
 * §4.5) — not client-side tab state, so the breadcrumb reflects the actual
 * URL ("Category › Category").
 */
describe("categories routes", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token" });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null });
  });

  it("redirects /admin/categories to the Category tab for an authenticated admin", async () => {
    await renderRoute("/admin/categories");
    expect(await screen.findByRole("heading", { name: "Category" })).toBeInTheDocument();
  });

  it("redirects /admin/categories/category to /login when unauthenticated", async () => {
    useAuthStore.setState({ token: null });
    await renderRoute("/admin/categories/category");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows all five tab links", async () => {
    await renderRoute("/admin/categories");
    for (const label of ["Category", "Sub Category", "Category Type", "Server Category", "Category Provider"]) {
      expect(await screen.findByRole("tab", { name: label })).toBeInTheDocument();
    }
  });
});
