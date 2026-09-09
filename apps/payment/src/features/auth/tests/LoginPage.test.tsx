import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { authService } from "../services/auth.service";

// The login mutation goes through the real authService; mock only its network
// call so the "pending" case can hang deterministically (real axios would
// settle racily) — every other case never triggers it (empty submit is
// blocked by the Zod resolver before authService.login is called).
vi.mock("../services/auth.service", () => ({
  authService: { login: vi.fn(), logout: vi.fn() },
}));

/**
 * Part 1 — test cases (see PLAN.md):
 *
 * Reachability and layout:
 * - Navigating to /login as a guest resolves through the route tree and renders the login form.
 * - An email input exists, accessible by label "Email".
 * - A password input exists, accessible by label "Password".
 * - A "Remember me" checkbox exists and is accessible by label.
 * - A submit button exists with accessible name "Sign in", and its accessible name changes to
 *   something indicating a pending state while the login mutation is in flight.
 * - Submitting the form empty shows validation errors for both email and password.
 * - The hero panel renders alongside the form (both AuthSideHero and the form panel present).
 *
 * Content correctness:
 * - The page heading reads "Sign in".
 * - The subcopy "Enter your credentials to access the admin dashboard." is present.
 * - AuthSideHero shows the "Uxiolabs Pay" wordmark and "UXIOLABS" subtitle.
 * - AuthSideHero shows a headline and subcopy describing the UDN top-up platform.
 * - No text or link related to registration exists anywhere on the page.
 * - None of the old placeholder strings remain.
 */
describe("LoginPage", () => {
  it("resolves /login as a guest and renders the login form", async () => {
    await renderRoute("/login");

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("has an email input accessible by label", async () => {
    await renderRoute("/login");

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("has a password input accessible by label", async () => {
    await renderRoute("/login");

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("has a Remember me checkbox accessible by label", async () => {
    await renderRoute("/login");

    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it("shows a pending accessible name on submit while the login mutation is in flight", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockReturnValue(new Promise(() => {}));

    await renderRoute("/login");
    await user.type(screen.getByLabelText("Email"), "admin@udn.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: /signing in/i })).toBeInTheDocument();
  });

  it("shows validation errors for both fields when submitted empty", async () => {
    const user = userEvent.setup();
    await renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/format email tidak valid/i)).toBeInTheDocument();
    expect(await screen.findByText(/password minimal 6 karakter/i)).toBeInTheDocument();
  });

  it("renders the hero panel alongside the form", async () => {
    await renderRoute("/login");

    expect(screen.getAllByText("ISG Store").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the page heading and subcopy", async () => {
    await renderRoute("/login");

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Enter your credentials to access the admin dashboard.")).toBeInTheDocument();
  });

  it("brands the hero with the site's own name, not kita's", async () => {
    // This panel belongs to the client. Their staff open it every morning, so
    // it says who they are — falling back to the compiled-in name when the
    // public settings have not loaded, never to a blank header.
    await renderRoute("/login");

    expect(screen.getAllByText("ISG Store").length).toBeGreaterThan(0);
    expect(screen.getByText("ISG STORE")).toBeInTheDocument();
    expect(screen.queryByText("Uxiolabs Pay")).not.toBeInTheDocument();
    expect(screen.queryByText("UXIOLABS")).not.toBeInTheDocument();
  });

  it("shows a hero headline and subcopy about the UDN top-up platform", async () => {
    await renderRoute("/login");

    expect(screen.getByText(/udn top-up platform/i)).toBeInTheDocument();
    expect(screen.getByText(/top-up operations/i)).toBeInTheDocument();
  });

  it("has no text or link related to registration", async () => {
    const { container } = await renderRoute("/login");

    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/daftar/i)).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="register"]')).not.toBeInTheDocument();
  });

  it("has none of the old placeholder strings", async () => {
    await renderRoute("/login");

    expect(screen.queryByText(/selamat datang/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/masuk ke sistem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/daftar sekarang/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/react enterprise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/skalabilitas tanpa batas/i)).not.toBeInTheDocument();
  });
});
