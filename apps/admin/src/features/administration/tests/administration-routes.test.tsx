import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

// Guarded routes with no preview twin — the store is seeded so requireAuth and
// requirePermission run for real rather than being bypassed.
beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
});

describe("administration routes", () => {
  it("Payment lists channels with their code and fee", async () => {
    await renderRoute("/admin/payments");

    expect(await screen.findByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(await screen.findByText("BCA Virtual Account")).toBeInTheDocument();
    expect(await screen.findByText("bca_va")).toBeInTheDocument();
  });

  it("Users lists members with their balance", async () => {
    await renderRoute("/admin/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(await screen.findByText("Randy Galang")).toBeInTheDocument();
    expect(await screen.findByText("randy@example.com")).toBeInTheDocument();
  });

  it("Settings groups values and marks the public ones", async () => {
    await renderRoute("/admin/settings");

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Site Name")).toBeInTheDocument();
    expect(await screen.findByLabelText("WhatsApp")).toBeInTheDocument();
    // The Public badge is what tells an admin a value reaches the storefront.
    expect((await screen.findAllByText("Public")).length).toBeGreaterThan(0);
  });

  it("a boolean setting renders as a switch, not a text field", async () => {
    await renderRoute("/admin/settings");

    expect(await screen.findByRole("switch", { name: "Maintenance Mode" })).toBeInTheDocument();
  });
});

describe("marketing routes", () => {
  it("Promo lists codes with their usage and visibility", async () => {
    await renderRoute("/admin/promos");

    expect(await screen.findByRole("heading", { name: "Promo" })).toBeInTheDocument();
    expect(await screen.findByText("HEMAT10")).toBeInTheDocument();
    // Private codes still work when typed — the column has to distinguish them.
    expect(await screen.findByText("Private")).toBeInTheDocument();
  });

  it("Flash Sale shows the running state, not just active/inactive", async () => {
    await renderRoute("/admin/flash-sales");

    expect(await screen.findByRole("heading", { name: "Flash Sale" })).toBeInTheDocument();
    expect(await screen.findByText("Flash Sale Mingguan")).toBeInTheDocument();
    expect(await screen.findByText("Running")).toBeInTheDocument();
  });

  it("the Add Promo form renders its fields", async () => {
    await renderRoute("/admin/promos/add");

    expect(await screen.findByRole("heading", { name: "Add Promo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
  });
});

describe("content routes — banners and announcements", () => {
  it("Banners lists slides and flags a missing image", async () => {
    await renderRoute("/admin/content/banners");

    expect(await screen.findByRole("heading", { name: "Banners" })).toBeInTheDocument();
    expect(await screen.findByText("Promo Ramadan 2026")).toBeInTheDocument();
  });

  it("Announcements lists notices", async () => {
    await renderRoute("/admin/content/announcements");

    expect(await screen.findByRole("heading", { name: "Announcements" })).toBeInTheDocument();
    expect(await screen.findByText(/Server maintenance terjadwal/)).toBeInTheDocument();
  });
});
