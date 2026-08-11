import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Router-level tests for the shared 404 / 503 status page (system_architecture.md §4.12).
 * Exercises the real notFoundComponent/errorComponent wiring on __root.tsx, not the
 * StatusPage component in isolation, so guard/layout behavior matches the real app.
 */
describe("StatusPage (404 / 503)", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null });
  });

  it("renders the 404 status page for an undefined route", async () => {
    await renderRoute("/this-does-not-exist");

    expect(await screen.findByRole("heading", { name: "Oops!" })).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText(/isn't found/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home page" })).toBeInTheDocument();
    expect(screen.queryByText("404")).not.toBeInTheDocument();
  });

  it("points the home link to /app/dashboard when a token exists", async () => {
    useAuthStore.setState({ token: "test-token" });

    await renderRoute("/this-does-not-exist");

    expect(await screen.findByRole("link", { name: "Back to home page" })).toHaveAttribute("href", "/app/dashboard");
  });

  it("points the home link to / when no token exists", async () => {
    await renderRoute("/this-does-not-exist");

    expect(await screen.findByRole("link", { name: "Back to home page" })).toHaveAttribute("href", "/");
  });
});
