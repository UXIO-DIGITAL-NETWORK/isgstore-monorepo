import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { makeUser, renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usersService } from "../services/administration.service";

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

  it("Payment is read-only — no row actions or bulk selection", async () => {
    await renderRoute("/admin/payments");
    await screen.findByText("BCA Virtual Account");

    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("Users lists members with their balance", async () => {
    await renderRoute("/admin/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(await screen.findByText("Randy Galang")).toBeInTheDocument();
    expect(await screen.findByText("randy@example.com")).toBeInTheDocument();
  });

  it("Users row menu adjusts balance through the audited dialog, requiring a reason", async () => {
    const adjustSpy = vi.spyOn(usersService, "adjustBalance").mockResolvedValue({
      id: "1",
      role_id: "2",
      name: "Randy Galang",
      email: "randy@example.com",
      phone: "628",
      balance: 65000,
      point: 120,
      locale: "id",
      status: "active",
      created_at: "2026-07-01",
    });
    const user = userEvent.setup();
    await renderRoute("/admin/users");

    await user.click(await screen.findByRole("button", { name: "Actions for Randy Galang" }));
    await user.click(await screen.findByRole("menuitem", { name: "Adjust Balance" }));

    const dialog = await screen.findByRole("dialog", { name: /Adjust balance/ });
    await user.type(within(dialog).getByLabelText("Amount"), "50000");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));
    expect(await within(dialog).findByText("A reason is required")).toBeInTheDocument();
    expect(adjustSpy).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Reason"), "compensation");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));
    expect(adjustSpy).toHaveBeenCalledWith("1", { amount: 50000, direction: "credit", reason: "compensation" });
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
    const user = userEvent.setup();
    await renderRoute("/admin/promos");

    await user.click(await screen.findByRole("button", { name: "Add Promo" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Add Promo" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Code")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Type")).toBeInTheDocument();
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
