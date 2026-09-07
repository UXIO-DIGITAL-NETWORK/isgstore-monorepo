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

  it("renders the 503 status page when /admin/error-preview throws", async () => {
    await renderRoute("/admin/error-preview");

    expect(await screen.findByRole("heading", { name: "Oops!" })).toBeInTheDocument();
    expect(screen.getByText(/on our end/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /server error/i })).toBeInTheDocument();
    expect(screen.getByText("503")).toBeInTheDocument();
  });

  it("shows a different illustration for the 404 page than the 503 page", async () => {
    const notFound = await renderRoute("/this-does-not-exist");
    const notFoundAlt = notFound.getByRole("img").getAttribute("alt");
    notFound.unmount();

    const serverError = await renderRoute("/admin/error-preview");
    const serverErrorAlt = serverError.getByRole("img").getAttribute("alt");

    expect(notFoundAlt).not.toBe(serverErrorAlt);
  });

  it("points the home link to /admin/dashboard when a token exists", async () => {
    useAuthStore.setState({ token: "test-token" });

    await renderRoute("/this-does-not-exist");

    expect(await screen.findByRole("link", { name: "Back to home page" })).toHaveAttribute("href", "/admin/dashboard");
  });

  it("points the home link to / when no token exists", async () => {
    await renderRoute("/this-does-not-exist");

    expect(await screen.findByRole("link", { name: "Back to home page" })).toHaveAttribute("href", "/");
  });
});
